<!-- AUTOGENERADO por tools/inventario/flujos.mjs. No editar manualmente. -->

# Flujos del módulo `scheduling`

- **Procesos:** 2 · **Máquinas de estado:** 1
- **Operaciones:** 67 (61 con decisiones propias, 6 sin ellas)
- Inventario de endpoints del módulo: [scheduling](../endpoints/scheduling.md)

## Proceso: Módulo 41 — Scheduling (agenda)

- **Código:** `scheduling` · **Agrupación:** AGRUPACION_POR_CONTROLADOR · **Operaciones:** 67
- **Actores:** CLINICIAN · Cualquier sesión válida · PATIENT · PRACTITIONER · SCHEDULING_ADMIN · SCHEDULING_AGENT · SUPPORT_STAFF · SYSTEM · SYSTEM_WORKER
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
| `ctrl:SchedulingBookingsController` | Operaciones de SchedulingBookingsController que el README no asigna a un caso de uso | GET /scheduling/bookings | SCHEDULING_ADMIN · SCHEDULING_AGENT · SUPPORT_STAFF · PRACTITIONER · PATIENT | BAJO | 28 |
|  |  | GET /scheduling/bookings/{id} | SCHEDULING_ADMIN · SCHEDULING_AGENT · SUPPORT_STAFF · PRACTITIONER · PATIENT | BAJO | 20 |
|  |  | POST /scheduling/bookings/{id}/accept | SCHEDULING_ADMIN · SCHEDULING_AGENT · SUPPORT_STAFF · PRACTITIONER | MEDIO | 67 |
|  |  | POST /scheduling/bookings/{id}/cancel | SCHEDULING_ADMIN · SCHEDULING_AGENT · SUPPORT_STAFF · PRACTITIONER · PATIENT | MEDIO | 56 |
|  |  | POST /scheduling/bookings/{id}/check-in | SCHEDULING_ADMIN · SCHEDULING_AGENT · SUPPORT_STAFF | MEDIO | 16 |
|  |  | POST /scheduling/bookings/{id}/complete | SCHEDULING_ADMIN · SCHEDULING_AGENT · PRACTITIONER | MEDIO | 24 |
|  |  | POST /scheduling/bookings/{id}/delay | SCHEDULING_ADMIN · SCHEDULING_AGENT · PRACTITIONER | MEDIO | 34 |
|  |  | GET /scheduling/bookings/{id}/payment-receipts | PATIENT · PRACTITIONER · SCHEDULING_ADMIN · SCHEDULING_AGENT | BAJO | 9 |
|  |  | POST /scheduling/bookings/{id}/payment-receipts | PATIENT | MEDIO | 38 |
|  |  | POST /scheduling/bookings/{id}/payment-receipts/{receiptId}/confirm | PRACTITIONER · SCHEDULING_ADMIN · SCHEDULING_AGENT | MEDIO | 45 |
|  |  | GET /scheduling/bookings/{id}/payment-receipts/{receiptId}/content | PATIENT · PRACTITIONER · SCHEDULING_ADMIN · SCHEDULING_AGENT | BAJO | 8 |
|  |  | POST /scheduling/bookings/{id}/payment-receipts/{receiptId}/reject | PRACTITIONER · SCHEDULING_ADMIN · SCHEDULING_AGENT | MEDIO | 44 |
|  |  | GET /scheduling/bookings/{id}/payment-state | SCHEDULING_ADMIN · SCHEDULING_AGENT · PRACTITIONER | BAJO | 13 |
|  |  | PUT /scheduling/bookings/{id}/payment-state | SCHEDULING_ADMIN · SCHEDULING_AGENT · PRACTITIONER | BAJO | 12 |
|  |  | POST /scheduling/bookings/{id}/propose-schedule | SCHEDULING_ADMIN · SCHEDULING_AGENT · PRACTITIONER | MEDIO | 21 |
|  |  | POST /scheduling/bookings/{id}/reject | SCHEDULING_ADMIN · SCHEDULING_AGENT · PRACTITIONER | MEDIO | 44 |
|  |  | POST /scheduling/bookings/{id}/reminders | SCHEDULING_ADMIN · SCHEDULING_AGENT | MEDIO | 3 |
|  |  | POST /scheduling/bookings/{id}/request-info | SCHEDULING_ADMIN · SCHEDULING_AGENT · PRACTITIONER | MEDIO | 16 |
|  |  | POST /scheduling/bookings/{id}/reschedule | SCHEDULING_ADMIN · SCHEDULING_AGENT · SUPPORT_STAFF · PRACTITIONER · PATIENT | MEDIO | 51 |
|  |  | POST /scheduling/bookings/{id}/start | SCHEDULING_ADMIN · SCHEDULING_AGENT · PRACTITIONER | MEDIO | 18 |
| `ctrl:SchedulingConfirmationController` | Operaciones de SchedulingConfirmationController que el README no asigna a un caso de uso | GET /scheduling/confirmation-rules | SCHEDULING_ADMIN | BAJO | 1 |
|  |  | POST /scheduling/confirmation-rules | SCHEDULING_ADMIN | MEDIO | 1 |
|  |  | POST /scheduling/confirmation-rules/{id}/activate | SCHEDULING_ADMIN | MEDIO | 2 |
|  |  | POST /scheduling/confirmation-rules/{id}/deactivate | SCHEDULING_ADMIN | MEDIO | 2 |
|  |  | POST /scheduling/confirmation-rules/evaluate | SCHEDULING_ADMIN | BAJO | 1 |
| `ctrl:SchedulingController` | Operaciones de SchedulingController que el README no asigna a un caso de uso | GET /scheduling/activity-types | SCHEDULING_ADMIN · SCHEDULING_AGENT · PRACTITIONER | BAJO | 0 |
|  |  | POST /scheduling/appointments/direct | SCHEDULING_ADMIN · SCHEDULING_AGENT · PRACTITIONER · SUPPORT_STAFF | MEDIO | 57 |
|  |  | POST /scheduling/appointments/walk-in | SCHEDULING_ADMIN · SCHEDULING_AGENT · PRACTITIONER | MEDIO | 35 |
|  |  | POST /scheduling/booking-policies | SCHEDULING_ADMIN · PRACTITIONER | MEDIO | 2 |
|  |  | GET /scheduling/exception-types | SCHEDULING_ADMIN · SCHEDULING_AGENT · PRACTITIONER | BAJO | 0 |
|  |  | DELETE /scheduling/exceptions/{id} | SCHEDULING_ADMIN · PRACTITIONER | ALTO | 3 |
|  |  | PATCH /scheduling/exceptions/{id} | SCHEDULING_ADMIN · PRACTITIONER | MEDIO | 5 |
|  |  | POST /scheduling/holds/{holdToken}/confirm | SCHEDULING_ADMIN · SCHEDULING_AGENT · SUPPORT_STAFF · PATIENT | MEDIO | 28 |
|  |  | POST /scheduling/holds/{holdToken}/request | SCHEDULING_ADMIN · SCHEDULING_AGENT · PATIENT | MEDIO | 53 |
|  |  | POST /scheduling/resources | SCHEDULING_ADMIN · PRACTITIONER | MEDIO | 4 |
|  |  | POST /scheduling/resources/{id}/close-slots | SCHEDULING_ADMIN · PRACTITIONER | MEDIO | 32 |
|  |  | POST /scheduling/resources/{id}/delay | SCHEDULING_ADMIN · SCHEDULING_AGENT · PRACTITIONER | MEDIO | 33 |
|  |  | GET /scheduling/resources/{id}/exceptions | SCHEDULING_ADMIN · PRACTITIONER · PATIENT | BAJO | 3 |
|  |  | POST /scheduling/resources/{id}/exceptions | SCHEDULING_ADMIN · PRACTITIONER | MEDIO | 32 |
|  |  | POST /scheduling/resources/{id}/shift-slots | SCHEDULING_ADMIN · PRACTITIONER | MEDIO | 32 |
|  |  | GET /scheduling/resources/{id}/slots | SCHEDULING_ADMIN · SCHEDULING_AGENT · PRACTITIONER · PATIENT | BAJO | 2 |
|  |  | GET /scheduling/resources/{id}/templates | SCHEDULING_ADMIN · PRACTITIONER | BAJO | 3 |
|  |  | POST /scheduling/resources/{id}/templates | SCHEDULING_ADMIN · PRACTITIONER | MEDIO | 5 |
|  |  | GET /scheduling/resources/{resourceId}/waitlist | SCHEDULING_ADMIN · SCHEDULING_AGENT · PRACTITIONER | BAJO | 4 |
|  |  | POST /scheduling/slots/{id}/holds | SCHEDULING_ADMIN · SCHEDULING_AGENT · SUPPORT_STAFF · PATIENT | MEDIO | 20 |
|  |  | DELETE /scheduling/templates/{id} | SCHEDULING_ADMIN · PRACTITIONER | ALTO | 35 |
|  |  | PATCH /scheduling/templates/{id} | SCHEDULING_ADMIN · PRACTITIONER | ALTO | 6 |
|  |  | POST /scheduling/templates/{id}/generate-slots | SCHEDULING_ADMIN · PRACTITIONER | MEDIO | 10 |
|  |  | GET /scheduling/templates/{id}/live-bookings | SCHEDULING_ADMIN · PRACTITIONER | BAJO | 6 |
|  |  | POST /scheduling/templates/{id}/reactivate | SCHEDULING_ADMIN · PRACTITIONER | MEDIO | 3 |
|  |  | GET /scheduling/waitlist | SCHEDULING_ADMIN · SCHEDULING_AGENT · PRACTITIONER · PATIENT | BAJO | 7 |
|  |  | POST /scheduling/waitlist | SCHEDULING_ADMIN · SCHEDULING_AGENT · SUPPORT_STAFF · PATIENT | MEDIO | 16 |
| `ctrl:SchedulingFlexibleController` | Operaciones de SchedulingFlexibleController que el README no asigna a un caso de uso | GET /scheduling/resources/{id}/flexible-availability | PATIENT · PRACTITIONER · CLINICIAN · SCHEDULING_ADMIN · SCHEDULING_AGENT | BAJO | 9 |
|  |  | POST /scheduling/resources/{id}/flexible-holds | PATIENT · SCHEDULING_ADMIN · SCHEDULING_AGENT | MEDIO | 17 |
| `ctrl:SchedulingInternalController` | Operaciones de SchedulingInternalController que el README no asigna a un caso de uso | POST /scheduling/internal/dispatch-reminders | SYSTEM · SYSTEM_WORKER | MEDIO | 33 |
|  |  | POST /scheduling/internal/expire-holds | SYSTEM · SYSTEM_WORKER | MEDIO | 10 |
|  |  | POST /scheduling/internal/promote-waitlist/{slotId} | SYSTEM · SYSTEM_WORKER | MEDIO | 31 |
|  |  | GET /scheduling/internal/waitlist-candidates | SYSTEM · SYSTEM_WORKER | BAJO | 2 |
| `ctrl:SchedulingServiceOfferingsController` | Operaciones de SchedulingServiceOfferingsController que el README no asigna a un caso de uso | GET /scheduling/service-availability | PATIENT · PRACTITIONER · CLINICIAN · SCHEDULING_ADMIN · SCHEDULING_AGENT | BAJO | 10 |
|  |  | GET /scheduling/service-offerings | PATIENT · PRACTITIONER · CLINICIAN · SCHEDULING_ADMIN · SCHEDULING_AGENT | BAJO | 2 |
|  |  | POST /scheduling/service-offerings | PRACTITIONER · CLINICIAN · SCHEDULING_ADMIN | MEDIO | 4 |
|  |  | PATCH /scheduling/service-offerings/{id} | PRACTITIONER · CLINICIAN · SCHEDULING_ADMIN | MEDIO | 3 |
|  |  | POST /scheduling/service-offerings/{id}/holds | PATIENT · SCHEDULING_ADMIN · SCHEDULING_AGENT | MEDIO | 19 |
| `ctrl:SupportAgendaController` | Operaciones de SupportAgendaController que el README no asigna a un caso de uso | GET /me/support-agenda | Cualquier sesión válida | BAJO | 16 |
| `ctrl:TenantAgendaController` | Operaciones de TenantAgendaController que el README no asigna a un caso de uso | GET /tenants/{tenantId}/agenda | Cualquier sesión válida | BAJO | 6 |

### Diagrama 1 de 3 — etapas `ctrl:SchedulingAgendaController`, `ctrl:SchedulingBookingsController`, `ctrl:SchedulingConfirmationController`

```mermaid
flowchart LR
  a2(["SCHEDULING_ADMIN · SCHEDULING_AGENT · PRACTITIONER · PATIENT"]):::actor
  a12(["SCHEDULING_ADMIN · SCHEDULING_AGENT · SUPPORT_STAFF · PRACT…"]):::actor
  a23(["SCHEDULING_ADMIN · SCHEDULING_AGENT · SUPPORT_STAFF · PRACT…"]):::actor
  a31(["SCHEDULING_ADMIN · SCHEDULING_AGENT · SUPPORT_STAFF"]):::actor
  a34(["SCHEDULING_ADMIN · SCHEDULING_AGENT · PRACTITIONER"]):::actor
  a39(["PATIENT · PRACTITIONER · SCHEDULING_ADMIN · SCHEDULING_AGENT"]):::actor
  a47(["PATIENT"]):::actor
  a50(["PRACTITIONER · SCHEDULING_ADMIN · SCHEDULING_AGENT"]):::actor
  a68(["SCHEDULING_ADMIN · SCHEDULING_AGENT"]):::actor
  a77(["SCHEDULING_ADMIN"]):::actor
  t3[("common.addresses")]:::tabla
  t4[("practice.care_spaces")]:::tabla
  t5[("practice.practice_sites")]:::tabla
  t6[("practice.practices")]:::tabla
  t7[("practice.practitioner_role_assignments")]:::tabla
  t8[("scheduling.schedulable_resources")]:::tabla
  t10[("scheduling.bookable_slots")]:::tabla
  t13[("audit.appointment_bookings_history")]:::tabla
  t14[("clinical.appointments")]:::tabla
  t15[("clinical.encounters")]:::tabla
  t16[("delegated_access.organization_user_assignments")]:::tabla
  t17[("delegated_access.practitioner_delegate_assignments")]:::tabla
  t18[("delegated_access.support_grant_actions")]:::tabla
  t24[("common.file_versions")]:::tabla
  t27[("community.conversation_participants")]:::tabla
  t28[("community.conversations")]:::tabla
  t40[("common.files")]:::tabla
  t41[("iam.users")]:::tabla
  t42[("profiles.patient_portal_proxies")]:::tabla
  t43[("profiles.patient_profiles")]:::tabla
  t44[("profiles.person_account_links")]:::tabla
  t53[("scheduling.appointment_bookings")]:::tabla
  t58[("delegated_access.support_scope_grants")]:::tabla
  t59[("directory.tenant_memberships")]:::tabla
  t69[("scheduling.appointment_reminders")]:::tabla
  t78[("scheduling.booking_confirmation_rules")]:::tabla
  subgraph s0["ctrl:SchedulingAgendaController · Operaciones de SchedulingAgendaController que…"]
    o1["GET /scheduling/resources"]:::op
    o9["GET /scheduling/slots"]:::op
  end
  t19[("+22 tablas más")]
  t21[("+14 tablas más")]
  t25[("+61 tablas más")]
  t29[("+50 tablas más")]
  t32[("+10 tablas más")]
  t35[("+18 tablas más")]
  t37[("+28 tablas más")]
  t45[("+3 tablas más")]
  t48[("+32 tablas más")]
  t51[("+39 tablas más")]
  t54[("+2 tablas más")]
  t56[("+38 tablas más")]
  t60[("+7 tablas más")]
  t62[("+6 tablas más")]
  t64[("+15 tablas más")]
  t66[("+38 tablas más")]
  t71[("+10 tablas más")]
  t73[("+45 tablas más")]
  t75[("+12 tablas más")]
  subgraph s1["ctrl:SchedulingBookingsController · Operaciones de SchedulingBookingsController…"]
    o11["GET /scheduling/bookings"]:::op
    o20["GET /scheduling/bookings/{id}"]:::op
    o22["POST /scheduling/bookings/{id}/accept"]:::op
    o26["POST /scheduling/bookings/{id}/cancel"]:::op
    o30["POST /scheduling/bookings/{id}/check-in"]:::op
    o33["POST /scheduling/bookings/{id}/complete"]:::op
    o36["POST /scheduling/bookings/{id}/delay"]:::op
    o38["GET /scheduling/bookings/{id}/payment-receipts"]:::op
    o46["POST /scheduling/bookings/{id}/payment-receipts"]:::op
    o49["POST /scheduling/bookings/{id}/payment-receipts/{receiptId}/confirm"]:::op
    o52["GET /scheduling/bookings/{id}/payment-receipts/{receiptId}/content"]:::op
    o55["POST /scheduling/bookings/{id}/payment-receipts/{receiptId}/reject"]:::op
    o57["GET /scheduling/bookings/{id}/payment-state"]:::op
    o61["PUT /scheduling/bookings/{id}/payment-state"]:::op
    o63["POST /scheduling/bookings/{id}/propose-schedule"]:::op
    o65["POST /scheduling/bookings/{id}/reject"]:::op
    o67["POST /scheduling/bookings/{id}/reminders"]:::op
    o70["POST /scheduling/bookings/{id}/request-info"]:::op
    o72["POST /scheduling/bookings/{id}/reschedule"]:::op
    o74["POST /scheduling/bookings/{id}/start"]:::op
  end
  subgraph s2["ctrl:SchedulingConfirmationController · Operaciones de SchedulingConfirmationCo…"]
    o76["GET /scheduling/confirmation-rules"]:::op
    o79["POST /scheduling/confirmation-rules"]:::op
    o80["POST /scheduling/confirmation-rules/{id}/activate"]:::op
    o81["POST /scheduling/confirmation-rules/{id}/deactivate"]:::op
    o82["POST /scheduling/confirmation-rules/evaluate"]:::op
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
  a12 --> o11
  o11 -->|"LEE"| t13
  o11 -->|"LEE"| t14
  o11 -->|"LEE"| t15
  o11 -->|"LEE"| t16
  o11 -->|"LEE"| t17
  o11 -->|"LEE"| t18
  o11 -.-> t19
  a12 --> o20
  o20 -->|"LEE"| t13
  o20 -->|"LEE"| t14
  o20 -->|"LEE"| t15
  o20 -->|"LEE"| t16
  o20 -->|"LEE"| t17
  o20 -->|"LEE"| t18
  o20 -.-> t21
  a23 --> o22
  o22 -->|"ACTUALIZA"| t13
  o22 -->|"CREA"| t13
  o22 -->|"LEE"| t13
  o22 -->|"ACTUALIZA"| t14
  o22 -->|"LEE"| t14
  o22 -->|"LEE"| t24
  o22 -.-> t25
  a12 --> o26
  o26 -->|"ACTUALIZA"| t13
  o26 -->|"CREA"| t13
  o26 -->|"LEE"| t13
  o26 -->|"CREA"| t27
  o26 -->|"LEE"| t27
  o26 -->|"CREA"| t28
  o26 -.-> t29
  a31 --> o30
  o30 -->|"ACTUALIZA"| t13
  o30 -->|"CREA"| t13
  o30 -->|"LEE"| t13
  o30 -->|"LEE"| t16
  o30 -->|"LEE"| t17
  o30 -->|"LEE"| t18
  o30 -.-> t32
  a34 --> o33
  o33 -->|"ACTUALIZA"| t13
  o33 -->|"CREA"| t13
  o33 -->|"LEE"| t13
  o33 -->|"ACTUALIZA"| t14
  o33 -->|"LEE"| t14
  o33 -->|"LEE"| t16
  o33 -.-> t35
  a34 --> o36
  o36 -->|"ACTUALIZA"| t13
  o36 -->|"CREA"| t13
  o36 -->|"LEE"| t13
  o36 -->|"CREA"| t27
  o36 -->|"LEE"| t27
  o36 -->|"CREA"| t28
  o36 -.-> t37
  a39 --> o38
  o38 -->|"LEE"| t24
  o38 -->|"LEE"| t40
  o38 -->|"LEE"| t41
  o38 -->|"LEE"| t42
  o38 -->|"LEE"| t43
  o38 -->|"LEE"| t44
  o38 -.-> t45
  a47 --> o46
  o46 -->|"LEE"| t24
  o46 -->|"LEE"| t40
  o46 -->|"CREA"| t27
  o46 -->|"LEE"| t27
  o46 -->|"CREA"| t28
  o46 -->|"LEE"| t28
  o46 -.-> t48
  a50 --> o49
  o49 -->|"LEE"| t24
  o49 -->|"LEE"| t40
  o49 -->|"CREA"| t27
  o49 -->|"LEE"| t27
  o49 -->|"CREA"| t28
  o49 -->|"LEE"| t28
  o49 -.-> t51
  a39 --> o52
  o52 -->|"LEE"| t24
  o52 -->|"LEE"| t40
  o52 -->|"LEE"| t42
  o52 -->|"LEE"| t43
  o52 -->|"LEE"| t44
  o52 -->|"LEE"| t53
  o52 -.-> t54
  a50 --> o55
  o55 -->|"LEE"| t24
  o55 -->|"LEE"| t40
  o55 -->|"CREA"| t27
  o55 -->|"LEE"| t27
  o55 -->|"CREA"| t28
  o55 -->|"LEE"| t28
  o55 -.-> t56
  a34 --> o57
  o57 -->|"LEE"| t16
  o57 -->|"LEE"| t17
  o57 -->|"LEE"| t18
  o57 -->|"LEE"| t58
  o57 -->|"LEE"| t59
  o57 -->|"LEE"| t4
  o57 -.-> t60
  a34 --> o61
  o61 -->|"LEE"| t16
  o61 -->|"LEE"| t17
  o61 -->|"LEE"| t18
  o61 -->|"LEE"| t58
  o61 -->|"LEE"| t59
  o61 -->|"LEE"| t4
  o61 -.-> t62
  a34 --> o63
  o63 -->|"ACTUALIZA"| t13
  o63 -->|"CREA"| t13
  o63 -->|"LEE"| t13
  o63 -->|"LEE"| t16
  o63 -->|"LEE"| t17
  o63 -->|"LEE"| t18
  o63 -.-> t64
  a34 --> o65
  o65 -->|"ACTUALIZA"| t13
  o65 -->|"CREA"| t13
  o65 -->|"LEE"| t13
  o65 -->|"LEE"| t16
  o65 -->|"LEE"| t17
  o65 -->|"LEE"| t18
  o65 -.-> t66
  a68 --> o67
  o67 -->|"LEE"| t53
  o67 -->|"CREA"| t69
  o67 -->|"LEE"| t10
  a34 --> o70
  o70 -->|"ACTUALIZA"| t13
  o70 -->|"CREA"| t13
  o70 -->|"LEE"| t13
  o70 -->|"LEE"| t16
  o70 -->|"LEE"| t17
  o70 -->|"LEE"| t18
  o70 -.-> t71
  a12 --> o72
  o72 -->|"ACTUALIZA"| t13
  o72 -->|"CREA"| t13
  o72 -->|"LEE"| t13
  o72 -->|"CREA"| t27
  o72 -->|"LEE"| t27
  o72 -->|"CREA"| t28
  o72 -.-> t73
  a34 --> o74
  o74 -->|"ACTUALIZA"| t13
  o74 -->|"CREA"| t13
  o74 -->|"LEE"| t13
  o74 -->|"ACTUALIZA"| t14
  o74 -->|"LEE"| t14
  o74 -->|"LEE"| t16
  o74 -.-> t75
  a77 --> o76
  o76 -->|"LEE"| t78
  a77 --> o79
  o79 -->|"CREA"| t78
  a77 --> o80
  o80 -->|"ACTUALIZA"| t78
  o80 -->|"LEE"| t78
  a77 --> o81
  o81 -->|"ACTUALIZA"| t78
  o81 -->|"LEE"| t78
  a77 --> o82
  o82 -->|"LEE"| t78
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

### Diagrama 2 de 3 — etapas `ctrl:SchedulingController`

```mermaid
flowchart LR
  a2(["SCHEDULING_ADMIN · SCHEDULING_AGENT · PRACTITIONER"]):::actor
  a4(["SCHEDULING_ADMIN · SCHEDULING_AGENT · PRACTITIONER · SUPPOR…"]):::actor
  a13(["SCHEDULING_ADMIN · PRACTITIONER"]):::actor
  a22(["SCHEDULING_ADMIN · SCHEDULING_AGENT · SUPPORT_STAFF · PATIE…"]):::actor
  a30(["SCHEDULING_ADMIN · SCHEDULING_AGENT · PATIENT"]):::actor
  a44(["SCHEDULING_ADMIN · PRACTITIONER · PATIENT"]):::actor
  a52(["SCHEDULING_ADMIN · SCHEDULING_AGENT · PRACTITIONER · PATIENT"]):::actor
  t5[("audit.appointment_bookings_history")]:::tabla
  t6[("clinical.appointments")]:::tabla
  t7[("clinical.encounters")]:::tabla
  t8[("community.conversation_participants")]:::tabla
  t14[("scheduling.booking_policies")]:::tabla
  t17[("scheduling.availability_exceptions")]:::tabla
  t18[("scheduling.schedulable_resources")]:::tabla
  t20[("scheduling.bookable_slots")]:::tabla
  t23[("billing.service_catalog")]:::tabla
  t24[("delegated_access.organization_user_assignments")]:::tabla
  t25[("delegated_access.practitioner_delegate_assignments")]:::tabla
  t26[("delegated_access.support_grant_actions")]:::tabla
  t27[("delegated_access.support_scope_grants")]:::tabla
  t31[("community.conversations")]:::tabla
  t34[("practice.practice_sites")]:::tabla
  t35[("practice.practices")]:::tabla
  t36[("profiles.practitioner_affiliations")]:::tabla
  t38[("iam.devices")]:::tabla
  t39[("messaging.in_app_notifications")]:::tabla
  t45[("scheduling.appointment_bookings")]:::tabla
  t49[("community.public_profiles")]:::tabla
  t54[("scheduling.schedule_rules")]:::tabla
  t55[("scheduling.schedule_templates")]:::tabla
  t58[("profiles.person_profiles")]:::tabla
  t59[("profiles.persons")]:::tabla
  t60[("scheduling.waitlist_entries")]:::tabla
  t62[("directory.tenant_memberships")]:::tabla
  t63[("practice.care_spaces")]:::tabla
  t69[("practice.healthcare_services")]:::tabla
  t70[("practice.practitioner_location_assignments")]:::tabla
  t71[("practice.practitioner_role_assignments")]:::tabla
  t76[("profiles.patient_portal_proxies")]:::tabla
  t77[("profiles.patient_profiles")]:::tabla
  t78[("profiles.person_account_links")]:::tabla
  t9[("+51 tablas más")]
  t11[("+29 tablas más")]
  t28[("+22 tablas más")]
  t32[("+47 tablas más")]
  t40[("+26 tablas más")]
  t42[("+27 tablas más")]
  t47[("+26 tablas más")]
  t50[("+26 tablas más")]
  t64[("+14 tablas más")]
  t66[("+29 tablas más")]
  t72[("+4 tablas más")]
  t79[("+1 tablas más")]
  t81[("+10 tablas más")]
  subgraph s0["ctrl:SchedulingController · Operaciones de SchedulingController que el README n…"]
    o1["GET /scheduling/activity-types"]:::op
    o3["POST /scheduling/appointments/direct"]:::op
    o10["POST /scheduling/appointments/walk-in"]:::op
    o12["POST /scheduling/booking-policies"]:::op
    o15["GET /scheduling/exception-types"]:::op
    o16["DELETE /scheduling/exceptions/{id}"]:::op
    o19["PATCH /scheduling/exceptions/{id}"]:::op
    o21["POST /scheduling/holds/{holdToken}/confirm"]:::op
    o29["POST /scheduling/holds/{holdToken}/request"]:::op
    o33["POST /scheduling/resources"]:::op
    o37["POST /scheduling/resources/{id}/close-slots"]:::op
    o41["POST /scheduling/resources/{id}/delay"]:::op
    o43["GET /scheduling/resources/{id}/exceptions"]:::op
    o46["POST /scheduling/resources/{id}/exceptions"]:::op
    o48["POST /scheduling/resources/{id}/shift-slots"]:::op
    o51["GET /scheduling/resources/{id}/slots"]:::op
    o53["GET /scheduling/resources/{id}/templates"]:::op
    o56["POST /scheduling/resources/{id}/templates"]:::op
    o57["GET /scheduling/resources/{resourceId}/waitlist"]:::op
    o61["POST /scheduling/slots/{id}/holds"]:::op
    o65["DELETE /scheduling/templates/{id}"]:::op
    o67["PATCH /scheduling/templates/{id}"]:::op
    o68["POST /scheduling/templates/{id}/generate-slots"]:::op
    o73["GET /scheduling/templates/{id}/live-bookings"]:::op
    o74["POST /scheduling/templates/{id}/reactivate"]:::op
    o75["GET /scheduling/waitlist"]:::op
    o80["POST /scheduling/waitlist"]:::op
  end
  a2 --> o1
  a4 --> o3
  o3 -->|"ACTUALIZA"| t5
  o3 -->|"CREA"| t5
  o3 -->|"LEE"| t5
  o3 -->|"CREA"| t6
  o3 -->|"LEE"| t7
  o3 -->|"CREA"| t8
  o3 -.-> t9
  a2 --> o10
  o10 -->|"ACTUALIZA"| t5
  o10 -->|"CREA"| t5
  o10 -->|"LEE"| t5
  o10 -->|"CREA"| t6
  o10 -->|"ACTUALIZA"| t6
  o10 -->|"LEE"| t6
  o10 -.-> t11
  a13 --> o12
  o12 -->|"CREA"| t14
  o12 -->|"LEE"| t14
  a2 --> o15
  a13 --> o16
  o16 -->|"BORRA"| t17
  o16 -->|"LEE"| t17
  o16 -->|"LEE"| t18
  a13 --> o19
  o19 -->|"ACTUALIZA"| t17
  o19 -->|"LEE"| t17
  o19 -->|"ACTUALIZA"| t20
  o19 -->|"LEE"| t20
  o19 -->|"LEE"| t18
  a22 --> o21
  o21 -->|"LEE"| t23
  o21 -->|"CREA"| t6
  o21 -->|"LEE"| t24
  o21 -->|"LEE"| t25
  o21 -->|"LEE"| t26
  o21 -->|"LEE"| t27
  o21 -.-> t28
  a30 --> o29
  o29 -->|"LEE"| t23
  o29 -->|"CREA"| t6
  o29 -->|"CREA"| t8
  o29 -->|"LEE"| t8
  o29 -->|"CREA"| t31
  o29 -->|"LEE"| t31
  o29 -.-> t32
  a13 --> o33
  o33 -->|"LEE"| t34
  o33 -->|"LEE"| t35
  o33 -->|"LEE"| t36
  o33 -->|"CREA"| t18
  a13 --> o37
  o37 -->|"ACTUALIZA"| t5
  o37 -->|"CREA"| t5
  o37 -->|"LEE"| t5
  o37 -->|"ACTUALIZA"| t38
  o37 -->|"LEE"| t38
  o37 -->|"CREA"| t39
  o37 -.-> t40
  a2 --> o41
  o41 -->|"ACTUALIZA"| t5
  o41 -->|"CREA"| t5
  o41 -->|"LEE"| t5
  o41 -->|"CREA"| t8
  o41 -->|"LEE"| t8
  o41 -->|"CREA"| t31
  o41 -.-> t42
  a44 --> o43
  o43 -->|"LEE"| t45
  o43 -->|"LEE"| t17
  o43 -->|"LEE"| t18
  a13 --> o46
  o46 -->|"ACTUALIZA"| t5
  o46 -->|"CREA"| t5
  o46 -->|"LEE"| t5
  o46 -->|"ACTUALIZA"| t38
  o46 -->|"LEE"| t38
  o46 -->|"CREA"| t39
  o46 -.-> t47
  a13 --> o48
  o48 -->|"CREA"| t8
  o48 -->|"LEE"| t8
  o48 -->|"CREA"| t31
  o48 -->|"LEE"| t31
  o48 -->|"ACTUALIZA"| t49
  o48 -->|"CREA"| t49
  o48 -.-> t50
  a52 --> o51
  o51 -->|"LEE"| t20
  o51 -->|"LEE"| t18
  a13 --> o53
  o53 -->|"LEE"| t18
  o53 -->|"LEE"| t54
  o53 -->|"LEE"| t55
  a13 --> o56
  o56 -->|"LEE"| t18
  o56 -->|"CREA"| t54
  o56 -->|"LEE"| t54
  o56 -->|"CREA"| t55
  o56 -->|"LEE"| t55
  a2 --> o57
  o57 -->|"LEE"| t58
  o57 -->|"LEE"| t59
  o57 -->|"LEE"| t18
  o57 -->|"LEE"| t60
  a22 --> o61
  o61 -->|"LEE"| t24
  o61 -->|"LEE"| t25
  o61 -->|"LEE"| t26
  o61 -->|"LEE"| t27
  o61 -->|"LEE"| t62
  o61 -->|"LEE"| t63
  o61 -.-> t64
  a13 --> o65
  o65 -->|"ACTUALIZA"| t5
  o65 -->|"CREA"| t5
  o65 -->|"LEE"| t5
  o65 -->|"ACTUALIZA"| t38
  o65 -->|"LEE"| t38
  o65 -->|"CREA"| t39
  o65 -.-> t66
  a13 --> o67
  o67 -->|"LEE"| t18
  o67 -->|"BORRA"| t54
  o67 -->|"CREA"| t54
  o67 -->|"LEE"| t54
  o67 -->|"ACTUALIZA"| t55
  o67 -->|"LEE"| t55
  a13 --> o68
  o68 -->|"LEE"| t69
  o68 -->|"LEE"| t70
  o68 -->|"LEE"| t71
  o68 -->|"LEE"| t45
  o68 -->|"LEE"| t17
  o68 -->|"CREA"| t20
  o68 -.-> t72
  a13 --> o73
  o73 -->|"LEE"| t58
  o73 -->|"LEE"| t59
  o73 -->|"LEE"| t45
  o73 -->|"LEE"| t20
  o73 -->|"LEE"| t18
  o73 -->|"LEE"| t55
  a13 --> o74
  o74 -->|"LEE"| t18
  o74 -->|"ACTUALIZA"| t55
  o74 -->|"LEE"| t55
  a52 --> o75
  o75 -->|"LEE"| t76
  o75 -->|"LEE"| t77
  o75 -->|"LEE"| t78
  o75 -->|"LEE"| t58
  o75 -->|"LEE"| t59
  o75 -->|"LEE"| t18
  o75 -.-> t79
  a22 --> o80
  o80 -->|"LEE"| t24
  o80 -->|"LEE"| t25
  o80 -->|"LEE"| t26
  o80 -->|"LEE"| t27
  o80 -->|"LEE"| t62
  o80 -->|"LEE"| t63
  o80 -.-> t81
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

### Diagrama 3 de 3 — etapas `ctrl:SchedulingFlexibleController`, `ctrl:SchedulingInternalController`, `ctrl:SchedulingServiceOfferingsController`…

```mermaid
flowchart LR
  a2(["PATIENT · PRACTITIONER · CLINICIAN · SCHEDULING_ADMIN · SCH…"]):::actor
  a11(["PATIENT · SCHEDULING_ADMIN · SCHEDULING_AGENT"]):::actor
  a20(["SYSTEM · SYSTEM_WORKER"]):::actor
  a36(["PRACTITIONER · CLINICIAN · SCHEDULING_ADMIN"]):::actor
  a42(["Cualquier sesión válida"]):::actor
  t3[("scheduling.appointment_bookings")]:::tabla
  t4[("scheduling.availability_exceptions")]:::tabla
  t5[("scheduling.bookable_slots")]:::tabla
  t6[("scheduling.booking_policies")]:::tabla
  t7[("scheduling.practitioner_service_offerings")]:::tabla
  t8[("scheduling.schedulable_resources")]:::tabla
  t12[("practice.practice_sites")]:::tabla
  t13[("practice.practices")]:::tabla
  t14[("profiles.patient_portal_proxies")]:::tabla
  t15[("profiles.patient_profiles")]:::tabla
  t16[("profiles.person_account_links")]:::tabla
  t17[("profiles.practitioner_affiliations")]:::tabla
  t21[("community.conversation_participants")]:::tabla
  t22[("community.conversations")]:::tabla
  t23[("community.public_profiles")]:::tabla
  t30[("scheduling.waitlist_entries")]:::tabla
  t32[("billing.service_catalog")]:::tabla
  t37[("practice.practitioner_role_assignments")]:::tabla
  t43[("delegated_access.organization_user_assignments")]:::tabla
  t44[("delegated_access.practitioner_delegate_assignments")]:::tabla
  t45[("delegated_access.support_grant_actions")]:::tabla
  t46[("delegated_access.support_scope_grants")]:::tabla
  t47[("directory.tenant_memberships")]:::tabla
  t48[("practice.care_spaces")]:::tabla
  t51[("profiles.persons")]:::tabla
  t9[("+3 tablas más")]
  t18[("+11 tablas más")]
  subgraph s0["ctrl:SchedulingFlexibleController · Operaciones de SchedulingFlexibleController…"]
    o1["GET /scheduling/resources/{id}/flexible-availability"]:::op
    o10["POST /scheduling/resources/{id}/flexible-holds"]:::op
  end
  t24[("+27 tablas más")]
  t26[("+4 tablas más")]
  t28[("+25 tablas más")]
  subgraph s1["ctrl:SchedulingInternalController · Operaciones de SchedulingInternalController…"]
    o19["POST /scheduling/internal/dispatch-reminders"]:::op
    o25["POST /scheduling/internal/expire-holds"]:::op
    o27["POST /scheduling/internal/promote-waitlist/{slotId}"]:::op
    o29["GET /scheduling/internal/waitlist-candidates"]:::op
  end
  t33[("+4 tablas más")]
  t40[("+13 tablas más")]
  subgraph s2["ctrl:SchedulingServiceOfferingsController · Operaciones de SchedulingServiceOff…"]
    o31["GET /scheduling/service-availability"]:::op
    o34["GET /scheduling/service-offerings"]:::op
    o35["POST /scheduling/service-offerings"]:::op
    o38["PATCH /scheduling/service-offerings/{id}"]:::op
    o39["POST /scheduling/service-offerings/{id}/holds"]:::op
  end
  t49[("+10 tablas más")]
  subgraph s3["ctrl:SupportAgendaController · Operaciones de SupportAgendaController que el RE…"]
    o41["GET /me/support-agenda"]:::op
  end
  subgraph s4["ctrl:TenantAgendaController · Operaciones de TenantAgendaController que el READ…"]
    o50["GET /tenants/{tenantId}/agenda"]:::op
  end
  a2 --> o1
  o1 -->|"LEE"| t3
  o1 -->|"LEE"| t4
  o1 -->|"LEE"| t5
  o1 -->|"LEE"| t6
  o1 -->|"LEE"| t7
  o1 -->|"LEE"| t8
  o1 -.-> t9
  a11 --> o10
  o10 -->|"LEE"| t12
  o10 -->|"LEE"| t13
  o10 -->|"LEE"| t14
  o10 -->|"LEE"| t15
  o10 -->|"LEE"| t16
  o10 -->|"LEE"| t17
  o10 -.-> t18
  a20 --> o19
  o19 -->|"CREA"| t21
  o19 -->|"LEE"| t21
  o19 -->|"CREA"| t22
  o19 -->|"LEE"| t22
  o19 -->|"ACTUALIZA"| t23
  o19 -->|"CREA"| t23
  o19 -.-> t24
  a20 --> o25
  o25 -->|"LEE"| t3
  o25 -->|"LEE"| t4
  o25 -->|"ACTUALIZA"| t5
  o25 -->|"LEE"| t5
  o25 -->|"LEE"| t7
  o25 -->|"LEE"| t8
  o25 -.-> t26
  a20 --> o27
  o27 -->|"CREA"| t21
  o27 -->|"LEE"| t21
  o27 -->|"CREA"| t22
  o27 -->|"LEE"| t22
  o27 -->|"ACTUALIZA"| t23
  o27 -->|"CREA"| t23
  o27 -.-> t28
  a20 --> o29
  o29 -->|"LEE"| t5
  o29 -->|"LEE"| t30
  a2 --> o31
  o31 -->|"LEE"| t32
  o31 -->|"LEE"| t3
  o31 -->|"LEE"| t4
  o31 -->|"LEE"| t5
  o31 -->|"LEE"| t6
  o31 -->|"LEE"| t7
  o31 -.-> t33
  a2 --> o34
  o34 -->|"LEE"| t32
  o34 -->|"LEE"| t7
  a36 --> o35
  o35 -->|"LEE"| t32
  o35 -->|"LEE"| t37
  o35 -->|"CREA"| t7
  o35 -->|"LEE"| t7
  a36 --> o38
  o38 -->|"LEE"| t32
  o38 -->|"ACTUALIZA"| t7
  o38 -->|"LEE"| t7
  a11 --> o39
  o39 -->|"LEE"| t32
  o39 -->|"LEE"| t12
  o39 -->|"LEE"| t13
  o39 -->|"LEE"| t14
  o39 -->|"LEE"| t15
  o39 -->|"LEE"| t16
  o39 -.-> t40
  a42 --> o41
  o41 -->|"LEE"| t43
  o41 -->|"LEE"| t44
  o41 -->|"LEE"| t45
  o41 -->|"LEE"| t46
  o41 -->|"LEE"| t47
  o41 -->|"LEE"| t48
  o41 -.-> t49
  a42 --> o50
  o50 -->|"LEE"| t43
  o50 -->|"LEE"| t47
  o50 -->|"LEE"| t51
  o50 -->|"LEE"| t3
  o50 -->|"LEE"| t5
  o50 -->|"LEE"| t8
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
| `P1` | `POST /scheduling/slots/:id/holds` — toma un slot con `SELECT ... FOR UPDATE`, decrementa `remaining_capacity` (nunca baja de cero). | POST /scheduling/slots/{id}/holds | SCHEDULING_ADMIN · SCHEDULING_AGENT · SUPPORT_STAFF · PATIENT | MEDIO | 20 |
| `P2` | `POST /scheduling/holds/:holdToken/confirm` — dentro del TTL del hold (`hold_ttl_seconds`, 300s por defecto), confirma → `appointment_bookings` en estado `confirmed` + se programan recordatorios. | POST /scheduling/holds/{holdToken}/confirm | SCHEDULING_ADMIN · SCHEDULING_AGENT · SUPPORT_STAFF · PATIENT | MEDIO | 28 |
| `P3` | `POST /scheduling/bookings/:id/check-in` — el día de la cita, pasa a `checked_in`. | POST /scheduling/bookings/{id}/check-in | SCHEDULING_ADMIN · SCHEDULING_AGENT · SUPPORT_STAFF | MEDIO | 16 |
| `A1` | **Reprogramar** (`POST /scheduling/bookings/:id/reschedule`): libera el cupo de origen, toma el de destino. | POST /scheduling/bookings/{id}/reschedule | SCHEDULING_ADMIN · SCHEDULING_AGENT · SUPPORT_STAFF · PRACTITIONER · PATIENT | MEDIO | 51 |
| `A2` | **Cancelar** (`POST /scheduling/bookings/:id/cancel`): libera el cupo; cobra cargo por inasistencia solo si la política define `no_show_fee_amount` **y** se marca como no-show — una cancelación avisada nunca se cobra. | POST /scheduling/bookings/{id}/cancel | SCHEDULING_ADMIN · SCHEDULING_AGENT · SUPPORT_STAFF · PRACTITIONER · PATIENT | MEDIO | 56 |
| `A3` | **Hold vencido**: `POST /scheduling/internal/expire-holds` (worker) recicla el cupo. Un hold vencido no se puede confirmar aunque el worker aún no haya corrido. | POST /scheduling/internal/expire-holds | SYSTEM · SYSTEM_WORKER | MEDIO | 10 |
| `A4` | **Excepción de disponibilidad** (`POST /scheduling/resources/:id/exceptions`): bloquea slots libres solapados — **no cancela** citas ya confirmadas (decisión clínica explícita, no efecto colateral automático). | POST /scheduling/resources/{id}/exceptions | SCHEDULING_ADMIN · PRACTITIONER | MEDIO | 32 |
| `A5` | **Lista de espera**: `POST /scheduling/waitlist` inscribe; el worker (`promote-waitlist`) marca candidatos cuando hay cupo, pero **no reserva por ellos** — el paciente confirma por el flujo normal. | POST /scheduling/waitlist | SCHEDULING_ADMIN · SCHEDULING_AGENT · SUPPORT_STAFF · PATIENT | MEDIO | 16 |

### Diagrama — etapas `P1`, `P2`, `P3`…

```mermaid
flowchart LR
  a2(["SCHEDULING_ADMIN · SCHEDULING_AGENT · SUPPORT_STAFF · PATIE…"]):::actor
  a15(["SCHEDULING_ADMIN · SCHEDULING_AGENT · SUPPORT_STAFF"]):::actor
  a19(["SCHEDULING_ADMIN · SCHEDULING_AGENT · SUPPORT_STAFF · PRACT…"]):::actor
  a26(["SYSTEM · SYSTEM_WORKER"]):::actor
  a34(["SCHEDULING_ADMIN · PRACTITIONER"]):::actor
  t3[("delegated_access.organization_user_assignments")]:::tabla
  t4[("delegated_access.practitioner_delegate_assignments")]:::tabla
  t5[("delegated_access.support_grant_actions")]:::tabla
  t6[("delegated_access.support_scope_grants")]:::tabla
  t7[("directory.tenant_memberships")]:::tabla
  t8[("practice.care_spaces")]:::tabla
  t11[("billing.service_catalog")]:::tabla
  t12[("clinical.appointments")]:::tabla
  t16[("audit.appointment_bookings_history")]:::tabla
  t20[("community.conversation_participants")]:::tabla
  t21[("community.conversations")]:::tabla
  t27[("scheduling.appointment_bookings")]:::tabla
  t28[("scheduling.availability_exceptions")]:::tabla
  t29[("scheduling.bookable_slots")]:::tabla
  t30[("scheduling.practitioner_service_offerings")]:::tabla
  t31[("scheduling.schedulable_resources")]:::tabla
  t35[("iam.devices")]:::tabla
  t36[("messaging.in_app_notifications")]:::tabla
  t9[("+14 tablas más")]
  subgraph s0["P1 · `POST /scheduling/slots/:id/holds` — toma un slot con `SELECT ... FOR UPDA…"]
    o1["POST /scheduling/slots/{id}/holds"]:::op
  end
  t13[("+22 tablas más")]
  subgraph s1["P2 · `POST /scheduling/holds/:holdToken/confirm` — dentro del TTL del hold (`ho…"]
    o10["POST /scheduling/holds/{holdToken}/confirm"]:::op
  end
  t17[("+10 tablas más")]
  subgraph s2["P3 · `POST /scheduling/bookings/:id/check-in` — el día de la cita, pasa a `chec…"]
    o14["POST /scheduling/bookings/{id}/check-in"]:::op
  end
  t22[("+45 tablas más")]
  subgraph s3["A1 · **Reprogramar** (`POST /scheduling/bookings/:id/reschedule`): libera el cu…"]
    o18["POST /scheduling/bookings/{id}/reschedule"]:::op
  end
  t24[("+50 tablas más")]
  subgraph s4["A2 · **Cancelar** (`POST /scheduling/bookings/:id/cancel`): libera el cupo; cob…"]
    o23["POST /scheduling/bookings/{id}/cancel"]:::op
  end
  t32[("+4 tablas más")]
  subgraph s5["A3 · **Hold vencido**: `POST /scheduling/internal/expire-holds` (worker) recicl…"]
    o25["POST /scheduling/internal/expire-holds"]:::op
  end
  t37[("+26 tablas más")]
  subgraph s6["A4 · **Excepción de disponibilidad** (`POST /scheduling/resources/:id/exception…"]
    o33["POST /scheduling/resources/{id}/exceptions"]:::op
  end
  t39[("+10 tablas más")]
  subgraph s7["A5 · **Lista de espera**: `POST /scheduling/waitlist` inscribe; el worker (`pro…"]
    o38["POST /scheduling/waitlist"]:::op
  end
  a2 --> o1
  o1 -->|"LEE"| t3
  o1 -->|"LEE"| t4
  o1 -->|"LEE"| t5
  o1 -->|"LEE"| t6
  o1 -->|"LEE"| t7
  o1 -->|"LEE"| t8
  o1 -.-> t9
  a2 --> o10
  o10 -->|"LEE"| t11
  o10 -->|"CREA"| t12
  o10 -->|"LEE"| t3
  o10 -->|"LEE"| t4
  o10 -->|"LEE"| t5
  o10 -->|"LEE"| t6
  o10 -.-> t13
  o1 ==>|"luego"| o10
  a15 --> o14
  o14 -->|"ACTUALIZA"| t16
  o14 -->|"CREA"| t16
  o14 -->|"LEE"| t16
  o14 -->|"LEE"| t3
  o14 -->|"LEE"| t4
  o14 -->|"LEE"| t5
  o14 -.-> t17
  o10 ==>|"luego"| o14
  a19 --> o18
  o18 -->|"ACTUALIZA"| t16
  o18 -->|"CREA"| t16
  o18 -->|"LEE"| t16
  o18 -->|"CREA"| t20
  o18 -->|"LEE"| t20
  o18 -->|"CREA"| t21
  o18 -.-> t22
  a19 --> o23
  o23 -->|"ACTUALIZA"| t16
  o23 -->|"CREA"| t16
  o23 -->|"LEE"| t16
  o23 -->|"CREA"| t20
  o23 -->|"LEE"| t20
  o23 -->|"CREA"| t21
  o23 -.-> t24
  a26 --> o25
  o25 -->|"LEE"| t27
  o25 -->|"LEE"| t28
  o25 -->|"ACTUALIZA"| t29
  o25 -->|"LEE"| t29
  o25 -->|"LEE"| t30
  o25 -->|"LEE"| t31
  o25 -.-> t32
  a34 --> o33
  o33 -->|"ACTUALIZA"| t16
  o33 -->|"CREA"| t16
  o33 -->|"LEE"| t16
  o33 -->|"ACTUALIZA"| t35
  o33 -->|"LEE"| t35
  o33 -->|"CREA"| t36
  o33 -.-> t37
  a2 --> o38
  o38 -->|"LEE"| t3
  o38 -->|"LEE"| t4
  o38 -->|"LEE"| t5
  o38 -->|"LEE"| t6
  o38 -->|"LEE"| t7
  o38 -->|"LEE"| t8
  o38 -.-> t39
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
  BOOKING_REQUESTED --> BOOKING_PENDING_CONFIRMATION : POST …/{id}/propose-schedule, POST …/{id}/request-info
  BOOKING_REQUESTED --> BOOKING_CONFIRMED : POST …/{id}/accept
  BOOKING_REQUESTED --> BOOKING_CANCELLED : POST …/{id}/cancel, POST …/{id}/reject, POST …/{id}/close-slots +2
  BOOKING_PENDING_CONFIRMATION --> BOOKING_CONFIRMED : POST …/{id}/accept
  BOOKING_PENDING_CONFIRMATION --> BOOKING_CANCELLED : POST …/{id}/cancel, POST …/{id}/reject, POST …/{id}/close-slots +2
  BOOKING_CONFIRMED --> BOOKING_CHECKED_IN : POST …/{id}/check-in
  BOOKING_CONFIRMED --> BOOKING_IN_PROGRESS : POST …/appointments/walk-in, POST …/{id}/start
  BOOKING_CONFIRMED --> BOOKING_CANCELLED : POST …/{id}/cancel, POST …/{id}/reject, POST …/{id}/close-slots +2
  BOOKING_CONFIRMED --> BOOKING_NO_SHOW
  BOOKING_CHECKED_IN --> BOOKING_IN_PROGRESS : POST …/appointments/walk-in, POST …/{id}/start
  BOOKING_CHECKED_IN --> BOOKING_CANCELLED : POST …/{id}/cancel, POST …/{id}/reject, POST …/{id}/close-slots +2
  BOOKING_CHECKED_IN --> BOOKING_NO_SHOW
  BOOKING_IN_PROGRESS --> BOOKING_COMPLETED : POST …/{id}/complete
  BOOKING_CANCELLED --> [*]
  BOOKING_NO_SHOW --> [*]
  BOOKING_COMPLETED --> [*]
```

**Operaciones que ejercen esta máquina** _(POR_REFERENCIA: el handler alcanza un método que valida contra la tabla; «sin destino nombrado» significa que el estado de destino llega por el cuerpo de la petición)_:

| Operación | Estados de destino que nombra | A través de |
|---|---|---|
| POST /scheduling/appointments/walk-in | BOOKING_IN_PROGRESS | StartAppointmentUseCase.executeInTransaction → BookingTransitionRecorder.assertTransition |
| POST /scheduling/bookings/{id}/accept | BOOKING_CONFIRMED | AcceptBookingUseCase.execute → BookingTransitionRecorder.assertTransition |
| POST /scheduling/bookings/{id}/cancel | BOOKING_CANCELLED | CancelBookingUseCase.cancelInTransaction → BookingTransitionRecorder.assertTransition |
| POST /scheduling/bookings/{id}/check-in | BOOKING_CHECKED_IN | CheckInBookingUseCase.execute → BookingTransitionRecorder.assertTransition |
| POST /scheduling/bookings/{id}/complete | BOOKING_COMPLETED | CompleteAppointmentUseCase.execute → BookingTransitionRecorder.assertTransition |
| POST /scheduling/bookings/{id}/propose-schedule | BOOKING_PENDING_CONFIRMATION | ProposeScheduleUseCase.execute → BookingTransitionRecorder.assertTransition |
| POST /scheduling/bookings/{id}/reject | BOOKING_CANCELLED | CancelBookingUseCase.cancelInTransaction → BookingTransitionRecorder.assertTransition |
| POST /scheduling/bookings/{id}/request-info | BOOKING_PENDING_CONFIRMATION | RequestBookingInfoUseCase.execute → BookingTransitionRecorder.assertTransition |
| POST /scheduling/bookings/{id}/start | BOOKING_IN_PROGRESS | StartAppointmentUseCase.execute → BookingTransitionRecorder.assertTransition |
| POST /scheduling/resources/{id}/close-slots | BOOKING_CANCELLED | CancelBookingUseCase.cancelInTransaction → BookingTransitionRecorder.assertTransition |
| POST /scheduling/resources/{id}/exceptions | BOOKING_CANCELLED | CancelBookingUseCase.cancelInTransaction → BookingTransitionRecorder.assertTransition |
| DELETE /scheduling/templates/{id} | BOOKING_CANCELLED | CancelBookingUseCase.cancelInTransaction → BookingTransitionRecorder.assertTransition |

## Árbol de decisión por operación

Cada árbol se deriva del código del handler y de los métodos que invoca (hasta 4 niveles). Una rama que no decide, no escribe y no falla se poda. Los accesos y los efectos consecutivos se agrupan en un solo nodo.

### Operaciones con decisiones propias

#### 1. GET /me/support-agenda

Agenda combinada del personal de apoyo, con la política resuelta

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios; BadRequestException: Los parámetros «org» y «tenantId» llegaron con valores distintos. |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: No tiene un vínculo de apoyo en esa organización |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: {range.reason ?? ''} |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de consulta (400) · parámetros de consulta (400)…"}}:::acceso
  n1 --> n2
  n3["Llama a SchedulingSupportAgendaService.list"]:::llamada
  n2 --> n3
  n4{"query.org && query.tenantId && query.org !== query.tenantId"}:::decision
  n3 --> n4
  n5(["400 VALIDATION_FAILED Los parámetros «org» y «tenantId» llegaron con valores distintos."]):::error
  n4 -->|"sí"| n5
  n6{"!range.ok"}:::decision
  n4 -->|"no"| n6
  n7(["422 PRECONDITION_FAILED {range.reason ?? ''}"]):::error
  n6 -->|"sí"| n7
  n8["Transacción: inTenantScope(…)"]:::transaccion
  n6 -->|"no"| n8
  n9["Llama a DelegatedAccessSupportAgendaAdapter.evaluator"]:::llamada
  n8 --> n9
  n10["Llama a SupportAccessPolicy.evaluatorFor"]:::llamada
  n9 --> n10
  n11["Llama a SupportAccessRepository.findEngagements"]:::llamada
  n10 --> n11
  n12{"filter.ids"}:::decision
  n11 --> n12
  n13[("LEE delegated_access.organization_user_assignments · LEE directory.tenant_memberships")]:::efecto
  n12 -->|"sí"| n13
  n14[("LEE directory.tenant_memberships · LEE delegated_access.organization_user_assignments")]:::efecto
  n12 -->|"no"| n14
  n15["Llama a SupportAccessRepository.findRoleAssignmentsOfTenant"]:::llamada
  n13 --> n15
  n14 --> n15
  n16[("LEE practice.practices · LEE practice.practitioner_role_assignments")]:::efecto
  n15 --> n16
  n17["Llama a SupportAccessRepository.findCareSpaceIdsOfTenant"]:::llamada
  n16 --> n17
  n18[("LEE practice.practices · LEE practice.practice_sites · LEE practice.care_spaces")]:::efecto
  n17 --> n18
  n19["Llama a SupportAccessRepository.findCareSpaces"]:::llamada
  n18 --> n19
  n20[("LEE practice.care_spaces")]:::efecto
  n19 --> n20
  n21{"standing === 'NO_ENGAGEMENT' || standing === 'ENGAGEMENT_INACTIVE'"}:::decision
  n20 --> n21
  n22(["403 FORBIDDEN No tiene un vínculo de apoyo en esa organización"]):::error
  n21 -->|"sí"| n22
  n23["Llama a SchedulingSupportAgendaRepository.findRows"]:::llamada
  n21 -->|"no"| n23
  n24{"filters.locations?.length"}:::decision
  n23 --> n24
  n25[("LEE practice.care_spaces")]:::efecto
  n24 -->|"sí"| n25
  n26[("LEE scheduling.appointment_bookings · LEE scheduling.bookable_slots · LEE scheduling.schedulable_resources ·…")]:::efecto
  n25 --> n26
  n24 -->|"no"| n26
  n27["Llama a SchedulingSupportAgendaRepository.findActiveWaits"]:::llamada
  n26 --> n27
  n28[("LEE scheduling.waitlist_entries")]:::efecto
  n27 --> n28
  n29["Llama a SchedulingSupportAgendaService.withOptions"]:::llamada
  n28 --> n29
  n30["Llama a SchedulingSupportAgendaRepository.namesOf"]:::llamada
  n29 --> n30
  n31[("LEE profiles.persons · LEE practice.healthcare_services · LEE terminology.catalog_concepts · LEE practice.car…")]:::efecto
  n30 --> n31
  n32(("200 Responde con éxito")):::ok
  n31 --> n32
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 2. POST /scheduling/appointments/direct

Asignar una cita puntual a un paciente (nace confirmada)

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {SUPPORT_DENIED_MESSAGE} / La agenda indicada pertenece a otra organización.; ForbiddenException: Un profesional solo puede asignar citas en su propia agenda.; ForbiddenException: No se puede declarar espacio ni servicio para esta agenda.; ForbiddenException: El doctor no atiende en ese espacio. / El doctor no presta ese servicio.; ForbiddenException: El personal de apoyo no puede realizar esta operación.; ForbiddenException: {SUPPORT_DENIED_MESSAGE}; ForbiddenException: La reconsulta se agenda en su propia agenda, no en la de otro profesional. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Recurso no encontrado; ResourceNotFoundException: La cita de la que sale esta reconsulta no existe; ResourceNotFoundException: Paciente no encontrado |
| 409 | `CONFLICT` | ConflictException: Esta consulta ya tiene una reconsulta agendada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Ese horario no atiende por telemedicina. Habilítela en la franja de su horario de atención o elija otra modalidad.; PreconditionFailedException: La reconsulta es para el paciente de la cita de origen; PreconditionFailedException: Una reconsulta se agenda para más adelante; PreconditionFailedException: Su vínculo con esta organización todavía está pendiente de aprobación, así que todavía no puede comprometer citas suyas. / Su vínculo con esta organización ya…; PreconditionFailedException: El profesional ya tiene {who} de {localTime( first.startAt, fir…} a {localTime( first.endAt, first…}{first.resourceName ? ` en «${…}. No puede estar en dos lug…; PreconditionFailedException: El paciente no está disponible en ese horario.; PreconditionFailedException: El paciente ya tiene una cita confirmada en ese rato{clash.resourceName ? ` en «${…}. |
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
  n12(["403 FORBIDDEN {SUPPORT_DENIED_MESSAGE} / La agenda indicada pertenece a otra organización."]):::error
  n11 -->|"sí"| n12
  n13{"!isSupportActor(actor, resource.tenantId) && !operatesAnyAgenda(actor, resource.tenantId) && !isOwnAgenda"}:::decision
  n11 -->|"no"| n13
  n14(["403 FORBIDDEN Un profesional solo puede asignar citas en su propia agenda."]):::error
  n13 -->|"sí"| n14
  n15["Llama a CreateDirectAppointmentUseCase.resolvePlace"]:::llamada
  n13 -->|"no"| n15
  n16{"!this.places || !PRACTITIONER_PROFILE_TABLES.includes(resource.resourceRefType)"}:::decision
  n15 --> n16
  n17{"supportDeclares && (dto.careSpaceId || dto.healthcareServiceId)"}:::decision
  n16 -->|"sí"| n17
  n18(["403 FORBIDDEN No se puede declarar espacio ni servicio para esta agenda."]):::error
  n17 -->|"sí"| n18
  n19{"place.rejected"}:::decision
  n17 -->|"no"| n19
  n16 -->|"no"| n19
  n20(["403 FORBIDDEN El doctor no atiende en ese espacio. / El doctor no presta ese servicio."]):::error
  n19 -->|"sí"| n20
  n21["Llama a BookingAccess.assertSupportMayCreate"]:::llamada
  n19 -->|"no"| n21
  n22{"!this.supportPolicy"}:::decision
  n21 --> n22
  n23(["403 FORBIDDEN El personal de apoyo no puede realizar esta operación."]):::error
  n22 -->|"sí"| n23
  n24{"!answer.allowed"}:::decision
  n22 -->|"no"| n24
  n25(["403 FORBIDDEN {SUPPORT_DENIED_MESSAGE}"]):::error
  n24 -->|"sí"| n25
  n26{"dto.channel === 'TELECONSULTA'"}:::decision
  n24 -->|"no"| n26
  n27["Llama a CreateDirectAppointmentUseCase.assertTelemedicineEnabled"]:::llamada
  n26 -->|"sí"| n27
  n28{"!startsInTelemedicineBand(startAt, bands, resource.timeZone ?? 'UTC')"}:::decision
  n27 --> n28
  n29(["422 PRECONDITION_FAILED Ese horario no atiende por telemedicina. Habilítela en la franja de su horario de ate…"]):::error
  n28 -->|"sí"| n29
  n30["Llama a CreateDirectAppointmentUseCase.validateFollowUp"]:::llamada
  n28 -->|"no"| n30
  n26 -->|"no"| n30
  n31{"!isOwnAgenda"}:::decision
  n30 --> n31
  n32(["403 FORBIDDEN La reconsulta se agenda en su propia agenda, no en la de otro profesional."]):::error
  n31 -->|"sí"| n32
  n33{"!originBooking"}:::decision
  n31 -->|"no"| n33
  n34(["404 NOT_FOUND La cita de la que sale esta reconsulta no existe"]):::error
  n33 -->|"sí"| n34
  n35{"originBooking.patientProfileId !== dto.patientProfileId"}:::decision
  n33 -->|"no"| n35
  n36(["422 PRECONDITION_FAILED La reconsulta es para el paciente de la cita de origen"]):::error
  n35 -->|"sí"| n36
  n37{"startAt.getTime() ‹= now.getTime()"}:::decision
  n35 -->|"no"| n37
  n38(["422 PRECONDITION_FAILED Una reconsulta se agenda para más adelante"]):::error
  n37 -->|"sí"| n38
  n39{"upcoming"}:::decision
  n37 -->|"no"| n39
  n40(["409 CONFLICT Esta consulta ya tiene una reconsulta agendada"]):::error
  n39 -->|"sí"| n40
  n41["Llama a BookingAccess.assertAffiliationCurrent"]:::llamada
  n39 -->|"no"| n41
  n42(["422 PRECONDITION_FAILED Su vínculo con esta organización todavía está pendiente de aprobación, así que todaví…"]):::error
  n41 --> n42
  n43["Llama a SchedulingBookingsRepository.findPatientNames"]:::llamada
  n44[("LEE profiles.patient_profiles · LEE profiles.persons")]:::efecto
  n43 --> n44
  n45{"!names.has(dto.patientProfileId)"}:::decision
  n44 --> n45
  n46(["404 NOT_FOUND Paciente no encontrado"]):::error
  n45 -->|"sí"| n46
  n47{"PRACTITIONER_PROFILE_TABLES.includes(resource.resourceRefType)"}:::decision
  n45 -->|"no"| n47
  n48["Llama a SchedulingProfessionalTimeService.assertRangeFree"]:::llamada
  n47 -->|"sí"| n48
  n49(["422 PRECONDITION_FAILED El profesional ya tiene {who} de {localTime( first.startAt, fir…} a {localTime( first…"]):::error
  n48 --> n49
  n50["Llama a SchedulingBookingsRepository.findPatientBookingsOverlapping"]:::llamada
  n47 -->|"no"| n50
  n51[("LEE scheduling.appointment_bookings · LEE scheduling.bookable_slots · LEE scheduling.schedulable_resources")]:::efecto
  n50 --> n51
  n52{"alreadyCommitted.length › 0"}:::decision
  n51 --> n52
  n53{"clash.tenantId !== resource.tenantId"}:::decision
  n52 -->|"sí"| n53
  n54(["422 PRECONDITION_FAILED El paciente no está disponible en ese horario."]):::error
  n53 -->|"sí"| n54
  n55(["422 PRECONDITION_FAILED El paciente ya tiene una cita confirmada en ese rato{clash.resourceName ? ` en «${…}."]):::error
  n53 -->|"no"| n55
  n56{"PRACTITIONER_PROFILE_TABLES.includes(resource.resourceRefType)"}:::decision
  n52 -->|"no"| n56
  n57["Llama a SchedulingCatalogRepository.findOpenSlotsOfProfessionalInWindow"]:::llamada
  n56 -->|"sí"| n57
  n58[("LEE scheduling.schedulable_resources · LEE scheduling.bookable_slots")]:::efecto
  n57 --> n58
  n59["Repite: por cada const free de freeOnes"]:::bucle
  n58 --> n59
  n60[("ACTUALIZA scheduling.bookable_slots")]:::efecto
  n59 -->|"cada elemento"| n60
  n61["Llama a SchedulingCatalogRepository.createSlot"]:::llamada
  n60 --> n61
  n59 -->|"al terminar"| n61
  n56 -->|"no"| n61
  n62[("CREA scheduling.bookable_slots")]:::efecto
  n61 --> n62
  n63["Llama a SchedulingBookingsRepository.createBooking"]:::llamada
  n62 --> n63
  n64[("CREA scheduling.appointment_bookings")]:::efecto
  n63 --> n64
  n65["Repite: por cada const offset de DEFAULT_REMINDER_OFFSETS"]:::bucle
  n64 --> n65
  n66["Llama a SchedulingBookingsRepository.createReminder"]:::llamada
  n65 -->|"cada elemento"| n66
  n67[("CREA scheduling.appointment_reminders")]:::efecto
  n66 --> n67
  n68{"dto.walkIn === true"}:::decision
  n67 --> n68
  n65 -->|"al terminar"| n68
  n69[("ACTUALIZA scheduling.appointment_bookings · ACTUALIZA scheduling.appointment_bookings")]:::efecto
  n68 -->|"sí"| n69
  n70["Llama a BookingChangeNotifier.notifyChange"]:::llamada
  n69 --> n70
  n68 -->|"no"| n70
  n71["… el resto del árbol (5 nodos) está en el JSON del inventario"]:::corte
  n70 --> n71
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 3. POST /scheduling/appointments/walk-in

Turno de mostrador atómico (walk-in)

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {SUPPORT_DENIED_MESSAGE} / La agenda indicada pertenece a otra organización.; ForbiddenException: Un profesional solo puede asignar citas en su propia agenda.; ForbiddenException: No se puede declarar espacio ni servicio para esta agenda.; ForbiddenException: El doctor no atiende en ese espacio. / El doctor no presta ese servicio.; ForbiddenException: El personal de apoyo no puede realizar esta operación.; ForbiddenException: {SUPPORT_DENIED_MESSAGE}; ForbiddenException: La reconsulta se agenda en su propia agenda, no en la de otro profesional. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Recurso no encontrado; ResourceNotFoundException: La cita de la que sale esta reconsulta no existe; ResourceNotFoundException: Paciente no encontrado |
| 409 | `CONFLICT` | ConflictException: Esta consulta ya tiene una reconsulta agendada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Ese horario no atiende por telemedicina. Habilítela en la franja de su horario de atención o elija otra modalidad.; PreconditionFailedException: La reconsulta es para el paciente de la cita de origen; PreconditionFailedException: Una reconsulta se agenda para más adelante; PreconditionFailedException: Su vínculo con esta organización todavía está pendiente de aprobación, así que todavía no puede comprometer citas suyas. / Su vínculo con esta organización ya…; PreconditionFailedException: El profesional ya tiene {who} de {localTime( first.startAt, fir…} a {localTime( first.endAt, first…}{first.resourceName ? ` en «${…}. No puede estar en dos lug…; PreconditionFailedException: El paciente no está disponible en ese horario.; PreconditionFailedException: El paciente ya tiene una cita confirmada en ese rato{clash.resourceName ? ` en «${…}.; PreconditionFailedException: Transición de estado de cita no permitida |
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
  n13(["403 FORBIDDEN {SUPPORT_DENIED_MESSAGE} / La agenda indicada pertenece a otra organización."]):::error
  n12 -->|"sí"| n13
  n14{"!isSupportActor(actor, resource.tenantId) && !operatesAnyAgenda(actor, resource.tenantId) && !isOwnAgenda"}:::decision
  n12 -->|"no"| n14
  n15(["403 FORBIDDEN Un profesional solo puede asignar citas en su propia agenda."]):::error
  n14 -->|"sí"| n15
  n16["Llama a CreateDirectAppointmentUseCase.resolvePlace"]:::llamada
  n14 -->|"no"| n16
  n17{"!this.places || !PRACTITIONER_PROFILE_TABLES.includes(resource.resourceRefType)"}:::decision
  n16 --> n17
  n18{"supportDeclares && (dto.careSpaceId || dto.healthcareServiceId)"}:::decision
  n17 -->|"sí"| n18
  n19(["403 FORBIDDEN No se puede declarar espacio ni servicio para esta agenda."]):::error
  n18 -->|"sí"| n19
  n20{"place.rejected"}:::decision
  n18 -->|"no"| n20
  n17 -->|"no"| n20
  n21(["403 FORBIDDEN El doctor no atiende en ese espacio. / El doctor no presta ese servicio."]):::error
  n20 -->|"sí"| n21
  n22["Llama a BookingAccess.assertSupportMayCreate"]:::llamada
  n20 -->|"no"| n22
  n23{"!this.supportPolicy"}:::decision
  n22 --> n23
  n24(["403 FORBIDDEN El personal de apoyo no puede realizar esta operación."]):::error
  n23 -->|"sí"| n24
  n25{"!answer.allowed"}:::decision
  n23 -->|"no"| n25
  n26(["403 FORBIDDEN {SUPPORT_DENIED_MESSAGE}"]):::error
  n25 -->|"sí"| n26
  n27{"dto.channel === 'TELECONSULTA'"}:::decision
  n25 -->|"no"| n27
  n28["Llama a CreateDirectAppointmentUseCase.assertTelemedicineEnabled"]:::llamada
  n27 -->|"sí"| n28
  n29{"!startsInTelemedicineBand(startAt, bands, resource.timeZone ?? 'UTC')"}:::decision
  n28 --> n29
  n30(["422 PRECONDITION_FAILED Ese horario no atiende por telemedicina. Habilítela en la franja de su horario de ate…"]):::error
  n29 -->|"sí"| n30
  n31["Llama a CreateDirectAppointmentUseCase.validateFollowUp"]:::llamada
  n29 -->|"no"| n31
  n27 -->|"no"| n31
  n32{"!isOwnAgenda"}:::decision
  n31 --> n32
  n33(["403 FORBIDDEN La reconsulta se agenda en su propia agenda, no en la de otro profesional."]):::error
  n32 -->|"sí"| n33
  n34{"!originBooking"}:::decision
  n32 -->|"no"| n34
  n35(["404 NOT_FOUND La cita de la que sale esta reconsulta no existe"]):::error
  n34 -->|"sí"| n35
  n36{"originBooking.patientProfileId !== dto.patientProfileId"}:::decision
  n34 -->|"no"| n36
  n37(["422 PRECONDITION_FAILED La reconsulta es para el paciente de la cita de origen"]):::error
  n36 -->|"sí"| n37
  n38{"startAt.getTime() ‹= now.getTime()"}:::decision
  n36 -->|"no"| n38
  n39(["422 PRECONDITION_FAILED Una reconsulta se agenda para más adelante"]):::error
  n38 -->|"sí"| n39
  n40{"upcoming"}:::decision
  n38 -->|"no"| n40
  n41(["409 CONFLICT Esta consulta ya tiene una reconsulta agendada"]):::error
  n40 -->|"sí"| n41
  n42["Llama a BookingAccess.assertAffiliationCurrent"]:::llamada
  n40 -->|"no"| n42
  n43(["422 PRECONDITION_FAILED Su vínculo con esta organización todavía está pendiente de aprobación, así que todaví…"]):::error
  n42 --> n43
  n44["Llama a SchedulingBookingsRepository.findPatientNames"]:::llamada
  n45[("LEE profiles.patient_profiles · LEE profiles.persons")]:::efecto
  n44 --> n45
  n46{"!names.has(dto.patientProfileId)"}:::decision
  n45 --> n46
  n47(["404 NOT_FOUND Paciente no encontrado"]):::error
  n46 -->|"sí"| n47
  n48{"PRACTITIONER_PROFILE_TABLES.includes(resource.resourceRefType)"}:::decision
  n46 -->|"no"| n48
  n49["Llama a SchedulingProfessionalTimeService.assertRangeFree"]:::llamada
  n48 -->|"sí"| n49
  n50(["422 PRECONDITION_FAILED El profesional ya tiene {who} de {localTime( first.startAt, fir…} a {localTime( first…"]):::error
  n49 --> n50
  n51["Llama a SchedulingBookingsRepository.findPatientBookingsOverlapping"]:::llamada
  n48 -->|"no"| n51
  n52[("LEE scheduling.appointment_bookings · LEE scheduling.bookable_slots · LEE scheduling.schedulable_resources")]:::efecto
  n51 --> n52
  n53{"alreadyCommitted.length › 0"}:::decision
  n52 --> n53
  n54{"clash.tenantId !== resource.tenantId"}:::decision
  n53 -->|"sí"| n54
  n55(["422 PRECONDITION_FAILED El paciente no está disponible en ese horario."]):::error
  n54 -->|"sí"| n55
  n56(["422 PRECONDITION_FAILED El paciente ya tiene una cita confirmada en ese rato{clash.resourceName ? ` en «${…}."]):::error
  n54 -->|"no"| n56
  n57{"PRACTITIONER_PROFILE_TABLES.includes(resource.resourceRefType)"}:::decision
  n53 -->|"no"| n57
  n58["Llama a SchedulingCatalogRepository.findOpenSlotsOfProfessionalInWindow"]:::llamada
  n57 -->|"sí"| n58
  n59[("LEE scheduling.schedulable_resources · LEE scheduling.bookable_slots")]:::efecto
  n58 --> n59
  n60["Repite: por cada const free de freeOnes"]:::bucle
  n59 --> n60
  n61[("ACTUALIZA scheduling.bookable_slots")]:::efecto
  n60 -->|"cada elemento"| n61
  n62["Llama a SchedulingCatalogRepository.createSlot"]:::llamada
  n61 --> n62
  n60 -->|"al terminar"| n62
  n57 -->|"no"| n62
  n63[("CREA scheduling.bookable_slots")]:::efecto
  n62 --> n63
  n64["Llama a SchedulingBookingsRepository.createBooking"]:::llamada
  n63 --> n64
  n65[("CREA scheduling.appointment_bookings")]:::efecto
  n64 --> n65
  n66["Repite: por cada const offset de DEFAULT_REMINDER_OFFSETS"]:::bucle
  n65 --> n66
  n67["Llama a SchedulingBookingsRepository.createReminder"]:::llamada
  n66 -->|"cada elemento"| n67
  n68[("CREA scheduling.appointment_reminders")]:::efecto
  n67 --> n68
  n69{"dto.walkIn === true"}:::decision
  n68 --> n69
  n66 -->|"al terminar"| n69
  n70[("ACTUALIZA scheduling.appointment_bookings · ACTUALIZA scheduling.appointment_bookings")]:::efecto
  n69 -->|"sí"| n70
  n71["… el resto del árbol (13 nodos) está en el JSON del inventario"]:::corte
  n70 --> n71
  n69 -->|"no"| n71
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 4. POST /scheduling/booking-policies

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

#### 5. GET /scheduling/bookings

UC-41-15: lista citas por paciente, recurso y/o ventana

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta agenda es de otro profesional: solo se lista desde su propia cuenta.; ForbiddenException: Esta cuenta no tiene un perfil de paciente con citas que listar.; ForbiddenException: El personal de apoyo no puede realizar esta operación.; ForbiddenException: {SUPPORT_DENIED_MESSAGE} |
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
  n9{"filters.resourceId"}:::decision
  n7 -->|"no"| n9
  n10["Llama a SchedulingCatalogRepository.findResourceById"]:::llamada
  n9 -->|"sí"| n10
  n11[("LEE scheduling.schedulable_resources")]:::efecto
  n10 --> n11
  n12{"actor && !operatesAnyAgenda(actor, tenantId) && !isSupportActor(actor, tenantId)"}:::decision
  n11 --> n12
  n13{"actor.practitionerProfileId !== undefined"}:::decision
  n12 -->|"sí"| n13
  n14{"resource.resourceRefId !== actor.practitionerProfileId"}:::decision
  n13 -->|"sí"| n14
  n15(["403 FORBIDDEN Esta agenda es de otro profesional: solo se lista desde su propia cuenta."]):::error
  n14 -->|"sí"| n15
  n16{"!filters.patientProfileId"}:::decision
  n13 -->|"no"| n16
  n17{"patientProfileIds.length === 0"}:::decision
  n16 -->|"sí"| n17
  n18(["403 FORBIDDEN Esta cuenta no tiene un perfil de paciente con citas que listar."]):::error
  n17 -->|"sí"| n18
  n19["Llama a SchedulingBookingsRepository.findBookings"]:::llamada
  n14 -->|"no"| n19
  n17 -->|"no"| n19
  n16 -->|"no"| n19
  n12 -->|"no"| n19
  n9 -->|"no"| n19
  n20[("LEE scheduling.appointment_bookings · LEE scheduling.bookable_slots")]:::efecto
  n19 --> n20
  n21["Llama a BookingAccess.keepVisibleToSupport"]:::llamada
  n20 --> n21
  n22["Repite: por cada const row de rows"]:::bucle
  n21 --> n22
  n23["Intenta"]:::intento
  n22 -->|"cada elemento"| n23
  n24["Llama a BookingAccess.decideSupport"]:::llamada
  n23 --> n24
  n25{"!action || !this.supportPolicy"}:::decision
  n24 --> n25
  n26(["403 FORBIDDEN El personal de apoyo no puede realizar esta operación."]):::error
  n25 -->|"sí"| n26
  n27{"!answer.allowed"}:::decision
  n25 -->|"no"| n27
  n28(["403 FORBIDDEN {SUPPORT_DENIED_MESSAGE}"]):::error
  n27 -->|"sí"| n28
  n29{"!(error instanceof ForbiddenException)"}:::decision
  n23 -->|"si falla"| n29
  n30(["↩ (relanza el error capturado)"]):::error
  n29 -->|"sí"| n30
  n31["Llama a AuditBookingHistoryAdapter.latestByBooking"]:::llamada
  n27 -->|"no"| n31
  n29 -->|"no"| n31
  n22 -->|"al terminar"| n31
  n32[("LEE audit.appointment_bookings_history")]:::efecto
  n31 --> n32
  n33["Llama a AuditBookingHistoryAdapter.latestByBooking"]:::llamada
  n32 --> n33
  n34[("LEE audit.appointment_bookings_history")]:::efecto
  n33 --> n34
  n35["Llama a SchedulingBookingsRepository.latestRescheduleOrigins"]:::llamada
  n34 --> n35
  n36[("LEE scheduling.booking_reschedules · LEE scheduling.bookable_slots")]:::efecto
  n35 --> n36
  n37{"actor?.practitionerProfileId !== undefined"}:::decision
  n36 --> n37
  n38["Repite: por cada const id de ids"]:::bucle
  n37 -->|"sí"| n38
  n39["Llama a SchedulingCatalogRepository.findResourceById"]:::llamada
  n38 -->|"cada elemento"| n39
  n40[("LEE scheduling.schedulable_resources")]:::efecto
  n39 --> n40
  n41["Llama a ClinicalAppointmentsAdapter.findTypesByIds"]:::llamada
  n40 --> n41
  n38 -->|"al terminar"| n41
  n37 -->|"no"| n41
  n42["Llama a AppointmentsRepository.findTypesByIds"]:::llamada
  n41 --> n42
  n43[("LEE clinical.appointments")]:::efecto
  n42 --> n43
  n44["Llama a ClinicalAppointmentsAdapter.findLatestEncounterIds"]:::llamada
  n43 --> n44
  n45["Llama a EncountersRepository.findLatestIdsByAppointmentIds"]:::llamada
  n44 --> n45
  n46[("LEE clinical.encounters")]:::efecto
  n45 --> n46
  n47["Llama a SchedulingBookingsRepository.findPatientNames"]:::llamada
  n46 --> n47
  n48[("LEE profiles.patient_profiles · LEE profiles.persons")]:::efecto
  n47 --> n48
  n49["Llama a SchedulingBookingsRepository.findPaymentStatesForBookings"]:::llamada
  n48 --> n49
  n50[("LEE scheduling.appointment_payment_states")]:::efecto
  n49 --> n50
  n51["Llama a InsuranceReadAdapter.findActiveCarriersByPatients"]:::llamada
  n50 --> n51
  n52["Llama a CoverageRepository.findActiveCarriersByPatients"]:::llamada
  n51 --> n52
  n53[("LEE insurance.patient_coverages · LEE insurance.insurance_plans · LEE insurance.insurance_products · LEE insu…")]:::efecto
  n52 --> n53
  n54["Llama a BookingItemAssembler.followUpLinks"]:::llamada
  n53 --> n54
  n55["Llama a SchedulingBookingsRepository.findBookingsWithSlotsByIds"]:::llamada
  n54 --> n55
  n56[("LEE scheduling.appointment_bookings")]:::efecto
  n55 --> n56
  n57["Llama a SchedulingBookingsRepository.findFollowUpsOf"]:::llamada
  n56 --> n57
  n58[("LEE scheduling.appointment_bookings")]:::efecto
  n57 --> n58
  n59(("200 Responde con éxito")):::ok
  n58 --> n59
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 6. GET /scheduling/bookings/{id}

UC-41-15: consulta una cita

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {SUPPORT_DENIED_MESSAGE}; ForbiddenException: El personal de apoyo no puede realizar esta operación.; ForbiddenException: Esta cita es de otra agenda: solo la opera quien atiende en ella. |
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
  n20{"actor && isSupportActor(actor, booking.tenantId)"}:::decision
  n19 -->|"no"| n20
  n21["Llama a BookingAccess.assertSupportMayAct"]:::llamada
  n20 -->|"sí"| n21
  n22["Llama a BookingAccess.assertSupportInActiveTenant"]:::llamada
  n21 --> n22
  n23{"!withinScope"}:::decision
  n22 --> n23
  n24(["403 FORBIDDEN {SUPPORT_DENIED_MESSAGE}"]):::error
  n23 -->|"sí"| n24
  n25["Llama a BookingAccess.decideSupport"]:::llamada
  n23 -->|"no"| n25
  n26{"!action || !this.supportPolicy"}:::decision
  n25 --> n26
  n27(["403 FORBIDDEN El personal de apoyo no puede realizar esta operación."]):::error
  n26 -->|"sí"| n27
  n28{"!answer.allowed"}:::decision
  n26 -->|"no"| n28
  n29(["403 FORBIDDEN {SUPPORT_DENIED_MESSAGE}"]):::error
  n28 -->|"sí"| n29
  n30{"actor && !operatesAnyAgenda(actor, booking.tenantId)"}:::decision
  n20 -->|"no"| n30
  n31{"!isOwnAgenda"}:::decision
  n30 -->|"sí"| n31
  n32(["403 FORBIDDEN Esta cita es de otra agenda: solo la opera quien atiende en ella."]):::error
  n31 -->|"sí"| n32
  n33["Llama a ClinicalAppointmentsAdapter.findTypesByIds"]:::llamada
  n19 -->|"sí"| n33
  n28 -->|"no"| n33
  n31 -->|"no"| n33
  n30 -->|"no"| n33
  n34["Llama a AppointmentsRepository.findTypesByIds"]:::llamada
  n33 --> n34
  n35[("LEE clinical.appointments")]:::efecto
  n34 --> n35
  n36["Llama a ClinicalAppointmentsAdapter.findLatestEncounterIds"]:::llamada
  n35 --> n36
  n37["Llama a EncountersRepository.findLatestIdsByAppointmentIds"]:::llamada
  n36 --> n37
  n38[("LEE clinical.encounters")]:::efecto
  n37 --> n38
  n39["Llama a BookingItemAssembler.followUpLinks"]:::llamada
  n38 --> n39
  n40["Llama a SchedulingBookingsRepository.findBookingsWithSlotsByIds"]:::llamada
  n39 --> n40
  n41[("LEE scheduling.appointment_bookings")]:::efecto
  n40 --> n41
  n42["Llama a SchedulingBookingsRepository.findFollowUpsOf"]:::llamada
  n41 --> n42
  n43[("LEE scheduling.appointment_bookings")]:::efecto
  n42 --> n43
  n44(("200 Responde con éxito")):::ok
  n43 --> n44
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 7. POST /scheduling/bookings/{id}/accept

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
  n59{"await this.serviceSlots.isOneOffOnDemand(tx, ownSlot)"}:::decision
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

#### 8. POST /scheduling/bookings/{id}/cancel

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
  n5["Llama a CancelBookingUseCase.cancelInTransaction"]:::llamada
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
  n25{"slot"}:::decision
  n24 --> n25
  n26[("ACTUALIZA scheduling.bookable_slots")]:::efecto
  n25 -->|"sí"| n26
  n27{"slot.scheduleTemplateId === undefined || slot.scheduleTemplateId === null || // P36: el turno de un horario f…"}:::decision
  n26 --> n27
  n28["Llama a ServiceSlotLifecycle.discardOneOffSlot"]:::llamada
  n27 -->|"sí"| n28
  n29[("ACTUALIZA scheduling.bookable_slots")]:::efecto
  n28 --> n29
  n30{"slot.statusConceptId !== CONCEPTS.SLOT_BLOCKED"}:::decision
  n27 -->|"no"| n30
  n31[("ACTUALIZA scheduling.bookable_slots")]:::efecto
  n30 -->|"sí"| n31
  n32["Llama a CancelBookingUseCase.promoteWaitlistFor"]:::llamada
  n29 --> n32
  n31 --> n32
  n30 -->|"no"| n32
  n25 -->|"no"| n32
  n33["Intenta"]:::intento
  n32 --> n33
  n34["Llama a SchedulingWaitlistService.promoteWaitlist"]:::llamada
  n33 --> n34
  n35["Transacción: transaction(…)"]:::transaccion
  n34 --> n35
  n36{"!slot"}:::decision
  n35 --> n36
  n37(["404 NOT_FOUND Slot no encontrado"]):::error
  n36 -->|"sí"| n37
  n38(("200 Responde con éxito")):::ok
  n36 -->|"no"| n38
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 9. POST /scheduling/bookings/{id}/check-in

Registrar la llegada del paciente

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {SUPPORT_DENIED_MESSAGE}; ForbiddenException: El personal de apoyo no puede realizar esta operación. |
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
  n10["Llama a BookingAccess.assertSupportMayAct"]:::llamada
  n8 -->|"no"| n10
  n11["Llama a BookingAccess.assertSupportInActiveTenant"]:::llamada
  n10 --> n11
  n12{"!withinScope"}:::decision
  n11 --> n12
  n13(["403 FORBIDDEN {SUPPORT_DENIED_MESSAGE}"]):::error
  n12 -->|"sí"| n13
  n14["Llama a BookingAccess.decideSupport"]:::llamada
  n12 -->|"no"| n14
  n15{"!action || !this.supportPolicy"}:::decision
  n14 --> n15
  n16(["403 FORBIDDEN El personal de apoyo no puede realizar esta operación."]):::error
  n15 -->|"sí"| n16
  n17{"!answer.allowed"}:::decision
  n15 -->|"no"| n17
  n18(["403 FORBIDDEN {SUPPORT_DENIED_MESSAGE}"]):::error
  n17 -->|"sí"| n18
  n19["Llama a BookingTransitionRecorder.assertTransition"]:::llamada
  n17 -->|"no"| n19
  n20{"!isValidBookingTransition(from, to)"}:::decision
  n19 --> n20
  n21(["422 PRECONDITION_FAILED Transición de estado de cita no permitida"]):::error
  n20 -->|"sí"| n21
  n22[("ACTUALIZA scheduling.appointment_bookings · ACTUALIZA scheduling.appointment_bookings")]:::efecto
  n20 -->|"no"| n22
  n23["Llama a BookingTransitionRecorder.recordTransition"]:::llamada
  n22 --> n23
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

#### 10. POST /scheduling/bookings/{id}/complete

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

#### 11. POST /scheduling/bookings/{id}/delay

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

#### 12. GET /scheduling/bookings/{id}/payment-receipts

Listar los comprobantes de pago de una cita

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a SchedulingPaymentReceiptsService.list"]:::llamada
  n2 --> n3
  n4["Llama a ListPaymentReceiptsUseCase.execute"]:::llamada
  n3 --> n4
  n5["Transacción: transactional(…)"]:::transaccion
  n4 --> n5
  n6["Llama a PaymentReceiptAccess.loadForReading"]:::llamada
  n5 --> n6
  n7["Llama a SchedulingBookingsRepository.findBookingByIdForUpdate"]:::llamada
  n6 --> n7
  n8[("LEE scheduling.appointment_bookings")]:::efecto
  n7 --> n8
  n9{"!booking"}:::decision
  n8 --> n9
  n10(["↩ (relanza el error capturado)"]):::error
  n9 -->|"sí"| n10
  n11["Llama a SchedulingPaymentReceiptsRepository.findForBooking"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE scheduling.appointment_payment_receipts")]:::efecto
  n11 --> n12
  n13["Llama a PaymentReceiptAccess.project"]:::llamada
  n12 --> n13
  n14["Llama a CommonPaymentReceiptFilesAdapter.describe"]:::llamada
  n13 --> n14
  n15[("LEE common.files · LEE common.file_versions")]:::efecto
  n14 --> n15
  n16["Llama a SchedulingPaymentReceiptsRepository.findUserDisplayNames"]:::llamada
  n15 --> n16
  n17[("LEE iam.users")]:::efecto
  n16 --> n17
  n18(("200 Responde con éxito")):::ok
  n17 --> n18
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 13. POST /scheduling/bookings/{id}/payment-receipts

Subir el comprobante de pago de una cita

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {labels.subject} no le pertenece |
| 404 | `NOT_FOUND` | ResourceNotFoundException: {labels.notFound} |
| 409 | `CONFLICT` | ConflictException: La cita ya está pagada: no hace falta otro comprobante. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Una cita cancelada o rechazada no lleva pago: no hay comprobante que subir.; PreconditionFailedException: {labels.subject} está borrado; PreconditionFailedException: {labels.subject} no tiene una versión vigente; PreconditionFailedException: El comprobante supera los 5 MB; PreconditionFailedException: El comprobante no es un archivo suyo que se pueda adjuntar |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a SchedulingPaymentReceiptsService.upload"]:::llamada
  n2 --> n3
  n4["Llama a UploadPaymentReceiptUseCase.execute"]:::llamada
  n3 --> n4
  n5["Transacción: transactional(…)"]:::transaccion
  n4 --> n5
  n6["Llama a PaymentReceiptAccess.loadForPatient"]:::llamada
  n5 --> n6
  n7["Llama a SchedulingBookingsRepository.findBookingByIdForUpdate"]:::llamada
  n6 --> n7
  n8[("LEE scheduling.appointment_bookings")]:::efecto
  n7 --> n8
  n9{"!booking"}:::decision
  n8 --> n9
  n10(["↩ (relanza el error capturado)"]):::error
  n9 -->|"sí"| n10
  n11{"!(await this.representation.representsPatient( booking.patientProfileId, actor, tx, ))"}:::decision
  n9 -->|"no"| n11
  n12(["↩ (relanza el error capturado)"]):::error
  n11 -->|"sí"| n12
  n13{"STATES_WITHOUT_PAYMENT.includes(booking.statusConceptId)"}:::decision
  n11 -->|"no"| n13
  n14(["422 PRECONDITION_FAILED Una cita cancelada o rechazada no lleva pago: no hay comprobante que subir."]):::error
  n13 -->|"sí"| n14
  n15["Llama a SchedulingBookingsRepository.findPaymentStateForUpdate"]:::llamada
  n13 -->|"no"| n15
  n16[("LEE scheduling.appointment_payment_states")]:::efecto
  n15 --> n16
  n17{"payment?.statusConceptId === SCHED.PAYMENT_PAID"}:::decision
  n16 --> n17
  n18(["409 CONFLICT La cita ya está pagada: no hace falta otro comprobante."]):::error
  n17 -->|"sí"| n18
  n19["Llama a CommonPaymentReceiptFilesAdapter.assertAttachable"]:::llamada
  n17 -->|"no"| n19
  n20["Intenta"]:::intento
  n19 --> n20
  n21["Llama a AttachableFileService.assertUsableBy"]:::llamada
  n20 --> n21
  n22{"!file"}:::decision
  n21 --> n22
  n23(["404 NOT_FOUND {labels.notFound}"]):::error
  n22 -->|"sí"| n23
  n24{"file.createdByUserId !== actor.id && !enAllowlist"}:::decision
  n22 -->|"no"| n24
  n25(["403 FORBIDDEN {labels.subject} no le pertenece"]):::error
  n24 -->|"sí"| n25
  n26{"file.deletedAt || file.lifecycleStatusConceptId === CONCEPTS.FILE_DELETED"}:::decision
  n24 -->|"no"| n26
  n27(["422 PRECONDITION_FAILED {labels.subject} está borrado"]):::error
  n26 -->|"sí"| n27
  n28{"!file.currentVersionId"}:::decision
  n26 -->|"no"| n28
  n29(["422 PRECONDITION_FAILED {labels.subject} no tiene una versión vigente"]):::error
  n28 -->|"sí"| n29
  n30{"Number(version.sizeBytes) › PAYMENT_RECEIPT_MAX_BYTES"}:::decision
  n28 -->|"no"| n30
  n31(["422 PRECONDITION_FAILED El comprobante supera los 5 MB"]):::error
  n30 -->|"sí"| n31
  n32{"error instanceof ResourceNotFoundException || error instanceof ForbiddenException"}:::decision
  n20 -->|"si falla"| n32
  n33(["422 PRECONDITION_FAILED El comprobante no es un archivo suyo que se pueda adjuntar"]):::error
  n32 -->|"sí"| n33
  n34(["↩ (relanza el error capturado)"]):::error
  n32 -->|"no"| n34
  n35[("CREA scheduling.appointment_payment_receipts · GUARDA scheduling.appointment_payment_receipts")]:::efecto
  n30 -->|"no"| n35
  n36["Llama a PaymentReceiptAccess.project"]:::llamada
  n35 --> n36
  n37["Llama a CommonPaymentReceiptFilesAdapter.describe"]:::llamada
  n36 --> n37
  n38[("LEE common.files · LEE common.file_versions")]:::efecto
  n37 --> n38
  n39["Llama a SchedulingPaymentReceiptsRepository.findUserDisplayNames"]:::llamada
  n38 --> n39
  n40[("LEE iam.users")]:::efecto
  n39 --> n40
  n41["Llama a BookingChangeNotifier.notifyReceiptUploaded"]:::llamada
  n40 --> n41
  n42["Transacción: safely(…)"]:::transaccion
  n41 --> n42
  n43["Llama a SchedulingNoticeRepository.describeBooking"]:::llamada
  n42 --> n43
  n44[("LEE scheduling.appointment_bookings · LEE scheduling.bookable_slots")]:::efecto
  n43 --> n44
  n45["Llama a SchedulingNoticeRepository.findResourceAccount"]:::llamada
  n44 --> n45
  n46[("LEE scheduling.schedulable_resources")]:::efecto
  n45 --> n46
  n47["Llama a SchedulingNoticeRepository.findDisplayNameForProfile"]:::llamada
  n46 --> n47
  n48[("LEE profiles.persons")]:::efecto
  n47 --> n48
  n49(("201 Responde con éxito")):::ok
  n48 --> n49
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 14. POST /scheduling/bookings/{id}/payment-receipts/{receiptId}/confirm

Confirmar un comprobante de pago

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta cita es de otra agenda: solo la opera quien atiende en ella.; ForbiddenException: {SUPPORT_DENIED_MESSAGE} / La agenda indicada pertenece a otra organización. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cita no encontrada; ResourceNotFoundException: Comprobante no encontrado |
| 409 | `CONFLICT` | ConflictException: Ese comprobante ya se rechazó: no se puede confirmar. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Una cita cancelada o rechazada no lleva estado de pago: no hubo atención que cobrar. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a SchedulingPaymentReceiptsService.confirm"]:::llamada
  n2 --> n3
  n4["Llama a ConfirmPaymentReceiptUseCase.execute"]:::llamada
  n3 --> n4
  n5["Transacción: transactional(…)"]:::transaccion
  n4 --> n5
  n6["Llama a PaymentReceiptAccess.loadForReviewer"]:::llamada
  n5 --> n6
  n7["Transacción: hideForbidden(…)"]:::transaccion
  n6 --> n7
  n8["Llama a BookingAccess.loadForOperation"]:::llamada
  n7 --> n8
  n9{"!booking"}:::decision
  n8 --> n9
  n10(["404 NOT_FOUND Cita no encontrada"]):::error
  n9 -->|"sí"| n10
  n11{"!isOwnAgenda"}:::decision
  n9 -->|"no"| n11
  n12(["403 FORBIDDEN Esta cita es de otra agenda: solo la opera quien atiende en ella."]):::error
  n11 -->|"sí"| n12
  n13{"operatesAnyAgenda(actor, booking.tenantId)"}:::decision
  n11 -->|"no"| n13
  n14["Llama a BookingAccess.assertResourceInActiveTenant"]:::llamada
  n13 -->|"sí"| n14
  n15{"!withinScope"}:::decision
  n14 --> n15
  n16(["403 FORBIDDEN {SUPPORT_DENIED_MESSAGE} / La agenda indicada pertenece a otra organización."]):::error
  n15 -->|"sí"| n16
  n17["Llama a PaymentReceiptAccess.receiptOf"]:::llamada
  n15 -->|"no"| n17
  n13 -->|"no"| n17
  n18["Llama a SchedulingPaymentReceiptsRepository.findOfBookingForUpdate"]:::llamada
  n17 --> n18
  n19[("LEE scheduling.appointment_payment_receipts")]:::efecto
  n18 --> n19
  n20["Llama a SchedulingPaymentReceiptsRepository.findOfBooking"]:::llamada
  n19 --> n20
  n21[("LEE scheduling.appointment_payment_receipts")]:::efecto
  n20 --> n21
  n22{"!receipt"}:::decision
  n21 --> n22
  n23(["404 NOT_FOUND Comprobante no encontrado"]):::error
  n22 -->|"sí"| n23
  n24{"receipt.reviewStatusConceptId === SCHED.RECEIPT_REJECTED"}:::decision
  n22 -->|"no"| n24
  n25(["409 CONFLICT Ese comprobante ya se rechazó: no se puede confirmar."]):::error
  n24 -->|"sí"| n25
  n26{"receipt.reviewStatusConceptId === SCHED.RECEIPT_CONFIRMED"}:::decision
  n24 -->|"no"| n26
  n27["Llama a SchedulingBookingsRepository.findPaymentState"]:::llamada
  n26 -->|"sí"| n27
  n28[("LEE scheduling.appointment_payment_states")]:::efecto
  n27 --> n28
  n29["Llama a PaymentReceiptAccess.project"]:::llamada
  n28 --> n29
  n30["Llama a CommonPaymentReceiptFilesAdapter.describe"]:::llamada
  n29 --> n30
  n31[("LEE common.files · LEE common.file_versions")]:::efecto
  n30 --> n31
  n32["Llama a SchedulingPaymentReceiptsRepository.findUserDisplayNames"]:::llamada
  n31 --> n32
  n33[("LEE iam.users")]:::efecto
  n32 --> n33
  n34{"STATES_WITHOUT_PAYMENT.includes(booking.statusConceptId)"}:::decision
  n33 --> n34
  n26 -->|"no"| n34
  n35(["422 PRECONDITION_FAILED Una cita cancelada o rechazada no lleva estado de pago: no hubo atención que cobrar."]):::error
  n34 -->|"sí"| n35
  n36[("ACTUALIZA scheduling.appointment_payment_receipts · ACTUALIZA scheduling.appointment_payment_receipts · ACTUA…")]:::efecto
  n34 -->|"no"| n36
  n37["Llama a PaymentReceiptAccess.project"]:::llamada
  n36 --> n37
  n38["Llama a CommonPaymentReceiptFilesAdapter.describe"]:::llamada
  n37 --> n38
  n39[("LEE common.files · LEE common.file_versions")]:::efecto
  n38 --> n39
  n40["Llama a SchedulingPaymentReceiptsRepository.findUserDisplayNames"]:::llamada
  n39 --> n40
  n41[("LEE iam.users")]:::efecto
  n40 --> n41
  n42{"changed"}:::decision
  n41 --> n42
  n43["Llama a BookingChangeNotifier.notifyReceiptReviewed"]:::llamada
  n42 -->|"sí"| n43
  n44["Transacción: safely(…)"]:::transaccion
  n43 --> n44
  n45["Llama a SchedulingNoticeRepository.describeBooking"]:::llamada
  n44 --> n45
  n46[("LEE scheduling.appointment_bookings · LEE scheduling.bookable_slots")]:::efecto
  n45 --> n46
  n47(("200 Responde con éxito")):::ok
  n46 --> n47
  n42 -->|"no"| n47
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 15. GET /scheduling/bookings/{id}/payment-receipts/{receiptId}/content

Descargar el archivo de un comprobante de pago

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Comprobante no encontrado; ResourceNotFoundException: Archivo no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El archivo del comprobante ya no es de un formato que se pueda mostrar |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a SchedulingPaymentReceiptsService.content"]:::llamada
  n2 --> n3
  n4["Llama a GetPaymentReceiptContentUseCase.execute"]:::llamada
  n3 --> n4
  n5["Transacción: transactional(…)"]:::transaccion
  n4 --> n5
  n6["Llama a PaymentReceiptAccess.loadForReading"]:::llamada
  n5 --> n6
  n7["Llama a SchedulingBookingsRepository.findBookingByIdForUpdate"]:::llamada
  n6 --> n7
  n8[("LEE scheduling.appointment_bookings")]:::efecto
  n7 --> n8
  n9{"!booking"}:::decision
  n8 --> n9
  n10(["↩ (relanza el error capturado)"]):::error
  n9 -->|"sí"| n10
  n11["Llama a PaymentReceiptAccess.receiptOf"]:::llamada
  n9 -->|"no"| n11
  n12["Llama a SchedulingPaymentReceiptsRepository.findOfBookingForUpdate"]:::llamada
  n11 --> n12
  n13[("LEE scheduling.appointment_payment_receipts")]:::efecto
  n12 --> n13
  n14["Llama a SchedulingPaymentReceiptsRepository.findOfBooking"]:::llamada
  n13 --> n14
  n15[("LEE scheduling.appointment_payment_receipts")]:::efecto
  n14 --> n15
  n16{"!receipt"}:::decision
  n15 --> n16
  n17(["404 NOT_FOUND Comprobante no encontrado"]):::error
  n16 -->|"sí"| n17
  n18["Llama a CommonPaymentReceiptFilesAdapter.download"]:::llamada
  n16 -->|"no"| n18
  n19["Llama a FileUploadService.downloadForAuthorizedContext"]:::llamada
  n18 --> n19
  n20{"!file"}:::decision
  n19 --> n20
  n21(["404 NOT_FOUND Archivo no encontrado"]):::error
  n20 -->|"sí"| n21
  n22{"!PAYMENT_RECEIPT_MIME_TYPES.includes(content.mimeType)"}:::decision
  n20 -->|"no"| n22
  n23(["422 PRECONDITION_FAILED El archivo del comprobante ya no es de un formato que se pueda mostrar"]):::error
  n22 -->|"sí"| n23
  n24(("200 Responde con éxito")):::ok
  n22 -->|"no"| n24
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 16. POST /scheduling/bookings/{id}/payment-receipts/{receiptId}/reject

Rechazar un comprobante de pago

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta cita es de otra agenda: solo la opera quien atiende en ella.; ForbiddenException: {SUPPORT_DENIED_MESSAGE} / La agenda indicada pertenece a otra organización. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cita no encontrada; ResourceNotFoundException: Comprobante no encontrado |
| 409 | `CONFLICT` | ConflictException: Ese comprobante ya se confirmó: no se puede rechazar. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a SchedulingPaymentReceiptsService.reject"]:::llamada
  n2 --> n3
  n4["Llama a RejectPaymentReceiptUseCase.execute"]:::llamada
  n3 --> n4
  n5["Transacción: transactional(…)"]:::transaccion
  n4 --> n5
  n6["Llama a PaymentReceiptAccess.loadForReviewer"]:::llamada
  n5 --> n6
  n7["Transacción: hideForbidden(…)"]:::transaccion
  n6 --> n7
  n8["Llama a BookingAccess.loadForOperation"]:::llamada
  n7 --> n8
  n9{"!booking"}:::decision
  n8 --> n9
  n10(["404 NOT_FOUND Cita no encontrada"]):::error
  n9 -->|"sí"| n10
  n11{"!isOwnAgenda"}:::decision
  n9 -->|"no"| n11
  n12(["403 FORBIDDEN Esta cita es de otra agenda: solo la opera quien atiende en ella."]):::error
  n11 -->|"sí"| n12
  n13{"operatesAnyAgenda(actor, booking.tenantId)"}:::decision
  n11 -->|"no"| n13
  n14["Llama a BookingAccess.assertResourceInActiveTenant"]:::llamada
  n13 -->|"sí"| n14
  n15{"!withinScope"}:::decision
  n14 --> n15
  n16(["403 FORBIDDEN {SUPPORT_DENIED_MESSAGE} / La agenda indicada pertenece a otra organización."]):::error
  n15 -->|"sí"| n16
  n17["Llama a PaymentReceiptAccess.receiptOf"]:::llamada
  n15 -->|"no"| n17
  n13 -->|"no"| n17
  n18["Llama a SchedulingPaymentReceiptsRepository.findOfBookingForUpdate"]:::llamada
  n17 --> n18
  n19[("LEE scheduling.appointment_payment_receipts")]:::efecto
  n18 --> n19
  n20["Llama a SchedulingPaymentReceiptsRepository.findOfBooking"]:::llamada
  n19 --> n20
  n21[("LEE scheduling.appointment_payment_receipts")]:::efecto
  n20 --> n21
  n22{"!receipt"}:::decision
  n21 --> n22
  n23(["404 NOT_FOUND Comprobante no encontrado"]):::error
  n22 -->|"sí"| n23
  n24{"row.reviewStatusConceptId === SCHED.RECEIPT_CONFIRMED"}:::decision
  n22 -->|"no"| n24
  n25(["409 CONFLICT Ese comprobante ya se confirmó: no se puede rechazar."]):::error
  n24 -->|"sí"| n25
  n26[("ACTUALIZA scheduling.appointment_payment_receipts · ACTUALIZA scheduling.appointment_payment_receipts · ACTUA…")]:::efecto
  n24 -->|"no"| n26
  n27["Llama a PaymentReceiptAccess.project"]:::llamada
  n26 --> n27
  n28["Llama a CommonPaymentReceiptFilesAdapter.describe"]:::llamada
  n27 --> n28
  n29[("LEE common.files · LEE common.file_versions")]:::efecto
  n28 --> n29
  n30["Llama a SchedulingPaymentReceiptsRepository.findUserDisplayNames"]:::llamada
  n29 --> n30
  n31[("LEE iam.users")]:::efecto
  n30 --> n31
  n32["Llama a BookingChangeNotifier.notifyReceiptReviewed"]:::llamada
  n31 --> n32
  n33["Transacción: safely(…)"]:::transaccion
  n32 --> n33
  n34["Llama a SchedulingNoticeRepository.describeBooking"]:::llamada
  n33 --> n34
  n35[("LEE scheduling.appointment_bookings · LEE scheduling.bookable_slots")]:::efecto
  n34 --> n35
  n36(("200 Responde con éxito")):::ok
  n35 --> n36
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 17. GET /scheduling/bookings/{id}/payment-state

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
  n15["Llama a SchedulingBookingsRepository.findPaymentState"]:::llamada
  n13 -->|"no"| n15
  n16[("LEE scheduling.appointment_payment_states")]:::efecto
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

#### 18. PUT /scheduling/bookings/{id}/payment-state

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
  n17(("200 Responde con éxito")):::ok
  n15 -->|"no"| n17
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 19. POST /scheduling/bookings/{id}/propose-schedule

Proponer otro horario para la solicitud

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta cita es de otra agenda: solo la opera quien atiende en ella. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cita no encontrada; ResourceNotFoundException: Cupo propuesto no encontrado |
| 409 | `CONFLICT` | ConflictException: El cupo propuesto no tiene lugar |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Sólo se opera así sobre una solicitud pendiente; PreconditionFailedException: Todavía no se puede {action} un servicio: cancele la reserva y pida otro horario.; PreconditionFailedException: Todavía no se puede {action} un turno de horario flexible: cancele la reserva y pida otra hora.; PreconditionFailedException: El horario propuesto es el que ya tiene la solicitud; PreconditionFailedException: Transición de estado de cita no permitida |
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
  n23{"slot && (await this.isFlexible(tx, slot))"}:::decision
  n21 -->|"no"| n23
  n24(["422 PRECONDITION_FAILED Todavía no se puede {action} un turno de horario flexible: cancele la reserva y pida…"]):::error
  n23 -->|"sí"| n24
  n25{"dto.proposedSlotId === originId"}:::decision
  n23 -->|"no"| n25
  n26(["422 PRECONDITION_FAILED El horario propuesto es el que ya tiene la solicitud"]):::error
  n25 -->|"sí"| n26
  n27["Llama a SchedulingBookingsRepository.findSlotForUpdate"]:::llamada
  n25 -->|"no"| n27
  n28[("LEE scheduling.bookable_slots")]:::efecto
  n27 --> n28
  n29{"!target"}:::decision
  n28 --> n29
  n30(["404 NOT_FOUND Cupo propuesto no encontrado"]):::error
  n29 -->|"sí"| n30
  n31{"target.remainingCapacity ‹= 0"}:::decision
  n29 -->|"no"| n31
  n32(["409 CONFLICT El cupo propuesto no tiene lugar"]):::error
  n31 -->|"sí"| n32
  n33["Llama a SchedulingBookingsRepository.findSlotForUpdate"]:::llamada
  n31 -->|"no"| n33
  n34[("LEE scheduling.bookable_slots")]:::efecto
  n33 --> n34
  n35{"originBooking"}:::decision
  n34 --> n35
  n36[("ACTUALIZA scheduling.bookable_slots")]:::efecto
  n35 -->|"sí"| n36
  n37{"originBooking.statusConceptId !== CONCEPTS.SLOT_BLOCKED"}:::decision
  n36 --> n37
  n38[("ACTUALIZA scheduling.bookable_slots")]:::efecto
  n37 -->|"sí"| n38
  n39[("ACTUALIZA scheduling.bookable_slots")]:::efecto
  n38 --> n39
  n37 -->|"no"| n39
  n35 -->|"no"| n39
  n40{"target.remainingCapacity === 0"}:::decision
  n39 --> n40
  n41[("ACTUALIZA scheduling.bookable_slots")]:::efecto
  n40 -->|"sí"| n41
  n42[("ACTUALIZA scheduling.appointment_bookings")]:::efecto
  n41 --> n42
  n40 -->|"no"| n42
  n43{"fromState !== SCHED.BOOKING_PENDING_CONFIRMATION"}:::decision
  n42 --> n43
  n44["Llama a BookingTransitionRecorder.assertTransition"]:::llamada
  n43 -->|"sí"| n44
  n45{"!isValidBookingTransition(from, to)"}:::decision
  n44 --> n45
  n46(["422 PRECONDITION_FAILED Transición de estado de cita no permitida"]):::error
  n45 -->|"sí"| n46
  n47[("ACTUALIZA scheduling.appointment_bookings")]:::efecto
  n45 -->|"no"| n47
  n48["Llama a SchedulingBookingsRepository.recordReschedule"]:::llamada
  n47 --> n48
  n43 -->|"no"| n48
  n49[("CREA scheduling.booking_reschedules")]:::efecto
  n48 --> n49
  n50["Llama a BookingTransitionRecorder.recordTransition"]:::llamada
  n49 --> n50
  n51["Llama a AuditBookingHistoryAdapter.append"]:::llamada
  n50 --> n51
  n52[("LEE audit.appointment_bookings_history · ACTUALIZA audit.appointment_bookings_history · CREA audit.appointmen…")]:::efecto
  n51 --> n52
  n53(("200 Responde con éxito")):::ok
  n52 --> n53
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 20. POST /scheduling/bookings/{id}/reject

Rechazar la solicitud de cita

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cita no encontrada |
| 409 | `CONFLICT` | ConflictException: La cita ya está cancelada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Puede cancelar hasta {Math.round(windowMinutes / 60)} horas antes del turno. Si ya no puede asistir, comuníquese con el consultorio. |
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
  n6["Llama a CancelBookingUseCase.cancelInTransaction"]:::llamada
  n5 --> n6
  n7{"!booking"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Cita no encontrada"]):::error
  n7 -->|"sí"| n8
  n9{"booking.statusConceptId === CONCEPTS.BOOKING_CANCELLED"}:::decision
  n7 -->|"no"| n9
  n10(["409 CONFLICT La cita ya está cancelada"]):::error
  n9 -->|"sí"| n10
  n11{"blocksHolderCancellation(isHolderPatient, withinWindow, isNoShow)"}:::decision
  n9 -->|"no"| n11
  n12(["422 PRECONDITION_FAILED Puede cancelar hasta {Math.round(windowMinutes / 60)} horas antes del turno. Si ya no…"]):::error
  n11 -->|"sí"| n12
  n13[("ACTUALIZA scheduling.appointment_bookings")]:::efecto
  n11 -->|"no"| n13
  n14{"slot"}:::decision
  n13 --> n14
  n15[("ACTUALIZA scheduling.bookable_slots")]:::efecto
  n14 -->|"sí"| n15
  n16{"slot.scheduleTemplateId === undefined || slot.scheduleTemplateId === null || // P36: el turno de un horario f…"}:::decision
  n15 --> n16
  n17{"slot.statusConceptId !== CONCEPTS.SLOT_BLOCKED"}:::decision
  n16 -->|"no"| n17
  n18[("ACTUALIZA scheduling.bookable_slots")]:::efecto
  n17 -->|"sí"| n18
  n19(("200 Responde con éxito")):::ok
  n16 -->|"sí"| n19
  n18 --> n19
  n17 -->|"no"| n19
  n14 -->|"no"| n19
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 21. POST /scheduling/bookings/{id}/reminders

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

#### 22. POST /scheduling/bookings/{id}/request-info

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

#### 23. POST /scheduling/bookings/{id}/reschedule

Reprogramar la cita a otro slot

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {SUPPORT_DENIED_MESSAGE}; ForbiddenException: El personal de apoyo no puede realizar esta operación. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cita no encontrada; ResourceNotFoundException: Slot destino no encontrado |
| 409 | `CONFLICT` | ConflictException: El slot destino no tiene cupos |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Solo se reprograma una cita vigente; PreconditionFailedException: Todavía no se puede {action} un servicio: cancele la reserva y pida otro horario.; PreconditionFailedException: Todavía no se puede {action} un turno de horario flexible: cancele la reserva y pida otra hora.; PreconditionFailedException: El slot destino es el mismo que el actual; PreconditionFailedException: El horario destino no está libre.; PreconditionFailedException: El horario destino ya pasó: elija uno futuro.; PreconditionFailedException: El horario destino es de otro servicio: la cita se mueve dentro del mismo servicio.; PreconditionFailedException: El paciente ya tiene una cita confirmada a esa hora{clash.resourceName ? ` en «${…}.; PreconditionFailedException: El profesional ya tiene {who} de {localTime( first.startAt, fir…} a {localTime( first.endAt, first…}{first.resourceName ? ` en «${…}. No puede estar en dos lug… |
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
  n10["Llama a BookingAccess.assertSupportMayAct"]:::llamada
  n8 -->|"no"| n10
  n11["Llama a BookingAccess.assertSupportInActiveTenant"]:::llamada
  n10 --> n11
  n12{"!withinScope"}:::decision
  n11 --> n12
  n13(["403 FORBIDDEN {SUPPORT_DENIED_MESSAGE}"]):::error
  n12 -->|"sí"| n13
  n14["Llama a BookingAccess.decideSupport"]:::llamada
  n12 -->|"no"| n14
  n15{"!action || !this.supportPolicy"}:::decision
  n14 --> n15
  n16(["403 FORBIDDEN El personal de apoyo no puede realizar esta operación."]):::error
  n15 -->|"sí"| n16
  n17{"!answer.allowed"}:::decision
  n15 -->|"no"| n17
  n18(["403 FORBIDDEN {SUPPORT_DENIED_MESSAGE}"]):::error
  n17 -->|"sí"| n18
  n19{"!ACTIVE_BOOKING_STATES.includes(booking.statusConceptId)"}:::decision
  n17 -->|"no"| n19
  n20(["422 PRECONDITION_FAILED Solo se reprograma una cita vigente"]):::error
  n19 -->|"sí"| n20
  n21["Llama a ServiceSlotLifecycle.assertNotAService"]:::llamada
  n19 -->|"no"| n21
  n22["Llama a SchedulingBookingsRepository.findSlotById"]:::llamada
  n21 --> n22
  n23[("LEE scheduling.bookable_slots")]:::efecto
  n22 --> n23
  n24{"slot?.practitionerServiceOfferingId"}:::decision
  n23 --> n24
  n25(["422 PRECONDITION_FAILED Todavía no se puede {action} un servicio: cancele la reserva y pida otro horario."]):::error
  n24 -->|"sí"| n25
  n26{"slot && (await this.isFlexible(tx, slot))"}:::decision
  n24 -->|"no"| n26
  n27(["422 PRECONDITION_FAILED Todavía no se puede {action} un turno de horario flexible: cancele la reserva y pida…"]):::error
  n26 -->|"sí"| n27
  n28{"fromSlotId === dto.toSlotId"}:::decision
  n26 -->|"no"| n28
  n29(["422 PRECONDITION_FAILED El slot destino es el mismo que el actual"]):::error
  n28 -->|"sí"| n29
  n30["Llama a SchedulingBookingsRepository.findSlotForUpdate"]:::llamada
  n28 -->|"no"| n30
  n31[("LEE scheduling.bookable_slots")]:::efecto
  n30 --> n31
  n32{"!target"}:::decision
  n31 --> n32
  n33(["404 NOT_FOUND Slot destino no encontrado"]):::error
  n32 -->|"sí"| n33
  n34["Llama a SchedulingCatalogRepository.findResourceById"]:::llamada
  n32 -->|"no"| n34
  n35[("LEE scheduling.schedulable_resources")]:::efecto
  n34 --> n35
  n36{"isSupportActor(actor, booking.tenantId)"}:::decision
  n35 --> n36
  n37["Llama a RescheduleBookingUseCase.assertSupportTarget"]:::llamada
  n36 -->|"sí"| n37
  n38{"!targetResource || targetResource.tenantId !== booking.tenantId"}:::decision
  n37 --> n38
  n39(["404 NOT_FOUND Slot destino no encontrado"]):::error
  n38 -->|"sí"| n39
  n40["Llama a BookingAccess.assertSupportMayOnSlot"]:::llamada
  n38 -->|"no"| n40
  n41{"!resource"}:::decision
  n40 --> n41
  n42(["403 FORBIDDEN {SUPPORT_DENIED_MESSAGE}"]):::error
  n41 -->|"sí"| n42
  n43{"declaredTenantId !== undefined && declaredTenantId !== resource.tenantId"}:::decision
  n41 -->|"no"| n43
  n44(["403 FORBIDDEN {SUPPORT_DENIED_MESSAGE}"]):::error
  n43 -->|"sí"| n44
  n45{"slotHoldRefusal(target) !== null"}:::decision
  n43 -->|"no"| n45
  n46(["422 PRECONDITION_FAILED El horario destino no está libre."]):::error
  n45 -->|"sí"| n46
  n47{"target.startAt.getTime() ‹= Date.now()"}:::decision
  n45 -->|"no"| n47
  n48(["422 PRECONDITION_FAILED El horario destino ya pasó: elija uno futuro."]):::error
  n47 -->|"sí"| n48
  n49{"(target.healthcareServiceId ?? null) !== (booking.healthcareServiceId ?? null)"}:::decision
  n47 -->|"no"| n49
  n50(["422 PRECONDITION_FAILED El horario destino es de otro servicio: la cita se mueve dentro del mismo servicio."]):::error
  n49 -->|"sí"| n50
  n51{"target.remainingCapacity ‹= 0"}:::decision
  n49 -->|"no"| n51
  n36 -->|"no"| n51
  n52(["409 CONFLICT El slot destino no tiene cupos"]):::error
  n51 -->|"sí"| n52
  n53["Llama a SchedulingBookingsRepository.findPatientBookingsOverlapping"]:::llamada
  n51 -->|"no"| n53
  n54[("LEE scheduling.appointment_bookings · LEE scheduling.bookable_slots · LEE scheduling.schedulable_resources")]:::efecto
  n53 --> n54
  n55{"patientClash.length › 0"}:::decision
  n54 --> n55
  n56(["422 PRECONDITION_FAILED El paciente ya tiene una cita confirmada a esa hora{clash.resourceName ? ` en «${…}."]):::error
  n55 -->|"sí"| n56
  n57{"targetResource && PRACTITIONER_PROFILE_TABLES.includes(targetResource.resourceRefType)"}:::decision
  n55 -->|"no"| n57
  n58["Llama a SchedulingProfessionalTimeService.assertRangeFree"]:::llamada
  n57 -->|"sí"| n58
  n59{"first.kind === 'ocupado'"}:::decision
  n58 --> n59
  n60{"first.patientProfileId"}:::decision
  n59 -->|"no"| n60
  n61["Llama a SchedulingBookingsRepository.findPatientNames"]:::llamada
  n60 -->|"sí"| n61
  n62[("LEE profiles.patient_profiles · LEE profiles.persons")]:::efecto
  n61 --> n62
  n63(["422 PRECONDITION_FAILED El profesional ya tiene {who} de {localTime( first.startAt, fir…} a {localTime( first…"]):::error
  n59 -->|"sí"| n63
  n62 --> n63
  n60 -->|"no"| n63
  n64["Llama a SchedulingBookingsRepository.findSlotForUpdate"]:::llamada
  n57 -->|"no"| n64
  n65[("LEE scheduling.bookable_slots")]:::efecto
  n64 --> n65
  n66{"origin"}:::decision
  n65 --> n66
  n67[("ACTUALIZA scheduling.bookable_slots")]:::efecto
  n66 -->|"sí"| n67
  n68{"origin.statusConceptId !== CONCEPTS.SLOT_BLOCKED"}:::decision
  n67 --> n68
  n69[("ACTUALIZA scheduling.bookable_slots")]:::efecto
  n68 -->|"sí"| n69
  n70[("ACTUALIZA scheduling.bookable_slots")]:::efecto
  n69 --> n70
  n68 -->|"no"| n70
  n66 -->|"no"| n70
  n71["… el resto del árbol (13 nodos) está en el JSON del inventario"]:::corte
  n70 --> n71
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 24. POST /scheduling/bookings/{id}/start

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

#### 25. POST /scheduling/confirmation-rules/{id}/activate

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

#### 26. POST /scheduling/confirmation-rules/{id}/deactivate

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

#### 27. DELETE /scheduling/exceptions/{id}

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

#### 28. PATCH /scheduling/exceptions/{id}

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

#### 29. POST /scheduling/holds/{holdToken}/confirm

Confirmar la cita a partir de la reserva temporal

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {SUPPORT_DENIED_MESSAGE} |
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
  n19["Llama a BookingAccess.assertSupportMayOnSlot"]:::llamada
  n17 -->|"no"| n19
  n20{"!resource"}:::decision
  n19 --> n20
  n21(["403 FORBIDDEN {SUPPORT_DENIED_MESSAGE}"]):::error
  n20 -->|"sí"| n21
  n22{"declaredTenantId !== undefined && declaredTenantId !== resource.tenantId"}:::decision
  n20 -->|"no"| n22
  n23(["403 FORBIDDEN {SUPPORT_DENIED_MESSAGE}"]):::error
  n22 -->|"sí"| n23
  n24{"slot.startAt.getTime() ‹= Date.now()"}:::decision
  n22 -->|"no"| n24
  n25(["422 PRECONDITION_FAILED Ese horario ya pasó."]):::error
  n24 -->|"sí"| n25
  n26["Llama a SchedulingBookingsRepository.findPatientBookingsOverlapping"]:::llamada
  n24 -->|"no"| n26
  n27[("LEE scheduling.appointment_bookings · LEE scheduling.bookable_slots · LEE scheduling.schedulable_resources")]:::efecto
  n26 --> n27
  n28{"alreadyCommitted.length › 0"}:::decision
  n27 --> n28
  n29(["422 PRECONDITION_FAILED Ya tiene una cita confirmada ese día a esa hora{clash.resourceName ? ` en «${…}. Canc…"]):::error
  n28 -->|"sí"| n29
  n30["Llama a SchedulingCatalogRepository.findResourceById"]:::llamada
  n28 -->|"no"| n30
  n31[("LEE scheduling.schedulable_resources")]:::efecto
  n30 --> n31
  n32{"resource && PRACTITIONER_PROFILE_TABLES.includes(resource.resourceRefType)"}:::decision
  n31 --> n32
  n33["Llama a SchedulingProfessionalTimeService.assertRangeFree"]:::llamada
  n32 -->|"sí"| n33
  n34(["422 PRECONDITION_FAILED El profesional ya tiene {who} de {localTime( first.startAt, fir…} a {localTime( first…"]):::error
  n33 --> n34
  n35["Llama a SchedulingBookingsRepository.createBooking"]:::llamada
  n32 -->|"no"| n35
  n36[("CREA scheduling.appointment_bookings")]:::efecto
  n35 --> n36
  n37[("ACTUALIZA scheduling.slot_holds")]:::efecto
  n36 --> n37
  n38{"slot.remainingCapacity === 0"}:::decision
  n37 --> n38
  n39[("ACTUALIZA scheduling.bookable_slots")]:::efecto
  n38 -->|"sí"| n39
  n40["Repite: por cada const offset de offsets"]:::bucle
  n39 --> n40
  n38 -->|"no"| n40
  n41["Llama a SchedulingBookingsRepository.createReminder"]:::llamada
  n40 -->|"cada elemento"| n41
  n42[("CREA scheduling.appointment_reminders")]:::efecto
  n41 --> n42
  n43(("201 Responde con éxito")):::ok
  n42 --> n43
  n40 -->|"al terminar"| n43
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 30. POST /scheduling/holds/{holdToken}/request

Solicitar la cita a partir de la reserva temporal

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {SUPPORT_DENIED_MESSAGE} |
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
  n19["Llama a BookingAccess.assertSupportMayOnSlot"]:::llamada
  n17 -->|"no"| n19
  n20{"!resource"}:::decision
  n19 --> n20
  n21(["403 FORBIDDEN {SUPPORT_DENIED_MESSAGE}"]):::error
  n20 -->|"sí"| n21
  n22{"declaredTenantId !== undefined && declaredTenantId !== resource.tenantId"}:::decision
  n20 -->|"no"| n22
  n23(["403 FORBIDDEN {SUPPORT_DENIED_MESSAGE}"]):::error
  n22 -->|"sí"| n23
  n24{"slot.startAt.getTime() ‹= Date.now()"}:::decision
  n22 -->|"no"| n24
  n25(["422 PRECONDITION_FAILED Ese horario ya pasó."]):::error
  n24 -->|"sí"| n25
  n26["Llama a SchedulingBookingsRepository.findPatientBookingsOverlapping"]:::llamada
  n24 -->|"no"| n26
  n27[("LEE scheduling.appointment_bookings · LEE scheduling.bookable_slots · LEE scheduling.schedulable_resources")]:::efecto
  n26 --> n27
  n28{"alreadyCommitted.length › 0"}:::decision
  n27 --> n28
  n29(["422 PRECONDITION_FAILED Ya tiene una cita confirmada ese día a esa hora{clash.resourceName ? ` en «${…}. Canc…"]):::error
  n28 -->|"sí"| n29
  n30["Llama a SchedulingCatalogRepository.findResourceById"]:::llamada
  n28 -->|"no"| n30
  n31[("LEE scheduling.schedulable_resources")]:::efecto
  n30 --> n31
  n32{"resource && PRACTITIONER_PROFILE_TABLES.includes(resource.resourceRefType)"}:::decision
  n31 --> n32
  n33["Llama a SchedulingProfessionalTimeService.assertRangeFree"]:::llamada
  n32 -->|"sí"| n33
  n34(["422 PRECONDITION_FAILED El profesional ya tiene {who} de {localTime( first.startAt, fir…} a {localTime( first…"]):::error
  n33 --> n34
  n35["Llama a SchedulingBookingsRepository.createBooking"]:::llamada
  n32 -->|"no"| n35
  n36[("CREA scheduling.appointment_bookings")]:::efecto
  n35 --> n36
  n37[("ACTUALIZA scheduling.slot_holds")]:::efecto
  n36 --> n37
  n38{"slot.remainingCapacity === 0"}:::decision
  n37 --> n38
  n39[("ACTUALIZA scheduling.bookable_slots")]:::efecto
  n38 -->|"sí"| n39
  n40["Repite: por cada const offset de offsets"]:::bucle
  n39 --> n40
  n38 -->|"no"| n40
  n41["Llama a SchedulingBookingsRepository.createReminder"]:::llamada
  n40 -->|"cada elemento"| n41
  n42[("CREA scheduling.appointment_reminders")]:::efecto
  n41 --> n42
  n43["Llama a BookingChangeNotifier.notifyRequest"]:::llamada
  n42 --> n43
  n40 -->|"al terminar"| n43
  n44["Llama a SchedulingNoticeRepository.describeBooking"]:::llamada
  n43 --> n44
  n45[("LEE scheduling.appointment_bookings · LEE scheduling.bookable_slots")]:::efecto
  n44 --> n45
  n46["Llama a SchedulingNoticeRepository.findResourceAccount"]:::llamada
  n45 --> n46
  n47[("LEE scheduling.schedulable_resources")]:::efecto
  n46 --> n47
  n48{"practitioner === null"}:::decision
  n47 --> n48
  n49["Llama a SchedulingNoticeRepository.findDisplayNameForProfile"]:::llamada
  n48 -->|"no"| n49
  n50[("LEE profiles.persons")]:::efecto
  n49 --> n50
  n51(("201 Responde con éxito")):::ok
  n48 -->|"sí"| n51
  n50 --> n51
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 31. POST /scheduling/internal/dispatch-reminders

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

#### 32. POST /scheduling/internal/expire-holds

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
  n13{"await this.serviceSlots.isOneOffOnDemand(tx, slot)"}:::decision
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

#### 33. POST /scheduling/internal/promote-waitlist/{slotId}

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

#### 34. GET /scheduling/resources

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

#### 35. POST /scheduling/resources

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

#### 36. POST /scheduling/resources/{id}/close-slots

Cerrar cupos sueltos, dejando el bloqueo que impide regenerarlos

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta agenda es de otro profesional: solo la administra quien atiende en ella.; ForbiddenException: Esta agenda es de otra organización: no puede ver ni cancelar sus citas. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Recurso no encontrado; ResourceNotFoundException: Ninguno de esos cupos es de esta agenda; ResourceNotFoundException: Cita no encontrada |
| 409 | `CONFLICT` | ConflictException: Esos ratos tienen pacientes citados: confirme para cancelar cada cita y avisar a cada persona; ConflictException: La cita ya está cancelada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Eligió «Otro» como motivo: escriba cuál es; PreconditionFailedException: Hay un paciente ya recibido en ese rato. Atiéndalo o cancele su cita desde la agenda antes de bloquear.; PreconditionFailedException: Puede cancelar hasta {Math.round(windowMinutes / 60)} horas antes del turno. Si ya no puede asistir, comuníquese con el consultorio. |
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
  n19["Llama a BlockedBookingsCanceller.describe"]:::llamada
  n17 -->|"no"| n19
  n20["Llama a SchedulingCatalogRepository.findBookingsOfSlots"]:::llamada
  n19 --> n20
  n21[("LEE scheduling.appointment_bookings")]:::efecto
  n20 --> n21
  n22["Llama a SchedulingCatalogRepository.findBookingsOfSlots"]:::llamada
  n21 --> n22
  n23[("LEE scheduling.appointment_bookings")]:::efecto
  n22 --> n23
  n24["Llama a SchedulingNoticeRepository.findDisplayNameForProfile"]:::llamada
  n23 --> n24
  n25[("LEE profiles.persons")]:::efecto
  n24 --> n25
  n26["Llama a CatalogAccess.assertMayReadAgendaBookings"]:::llamada
  n25 --> n26
  n27{"!actor.tenantIds?.includes(resource.tenantId)"}:::decision
  n26 --> n27
  n28(["403 FORBIDDEN Esta agenda es de otra organización: no puede ver ni cancelar sus citas."]):::error
  n27 -->|"sí"| n28
  n29["Llama a BlockedBookingsCanceller.assertNobodyPresent"]:::llamada
  n27 -->|"no"| n29
  n30(["422 PRECONDITION_FAILED Hay un paciente ya recibido en ese rato. Atiéndalo o cancele su cita desde la agenda…"]):::error
  n29 --> n30
  n31{"affected.cancellable.length › 0 && dto.cancelAffectedBookings !== true"}:::decision
  n32(["409 CONFLICT Esos ratos tienen pacientes citados: confirme para cancelar cada cita y avisar a cada persona"]):::error
  n31 -->|"sí"| n32
  n33{"affected.cancellable.length › 0"}:::decision
  n31 -->|"no"| n33
  n34["Llama a BlockedBookingsCanceller.cancelAll"]:::llamada
  n33 -->|"sí"| n34
  n35["Repite: por cada const booking de affected"]:::bucle
  n34 --> n35
  n36["Llama a CancelBookingUseCase.cancelInTransaction"]:::llamada
  n35 -->|"cada elemento"| n36
  n37{"!booking"}:::decision
  n36 --> n37
  n38(["404 NOT_FOUND Cita no encontrada"]):::error
  n37 -->|"sí"| n38
  n39{"booking.statusConceptId === CONCEPTS.BOOKING_CANCELLED"}:::decision
  n37 -->|"no"| n39
  n40(["409 CONFLICT La cita ya está cancelada"]):::error
  n39 -->|"sí"| n40
  n41{"blocksHolderCancellation(isHolderPatient, withinWindow, isNoShow)"}:::decision
  n39 -->|"no"| n41
  n42(["422 PRECONDITION_FAILED Puede cancelar hasta {Math.round(windowMinutes / 60)} horas antes del turno. Si ya no…"]):::error
  n41 -->|"sí"| n42
  n43[("ACTUALIZA scheduling.appointment_bookings")]:::efecto
  n41 -->|"no"| n43
  n44{"slot"}:::decision
  n43 --> n44
  n45[("ACTUALIZA scheduling.bookable_slots")]:::efecto
  n44 -->|"sí"| n45
  n46{"slot.scheduleTemplateId === undefined || slot.scheduleTemplateId === null || // P36: el turno de un horario f…"}:::decision
  n45 --> n46
  n47{"slot.statusConceptId !== CONCEPTS.SLOT_BLOCKED"}:::decision
  n46 -->|"no"| n47
  n48[("ACTUALIZA scheduling.bookable_slots")]:::efecto
  n47 -->|"sí"| n48
  n49["Repite: por cada const slot de slots"]:::bucle
  n46 -->|"sí"| n49
  n48 --> n49
  n47 -->|"no"| n49
  n44 -->|"no"| n49
  n35 -->|"al terminar"| n49
  n33 -->|"no"| n49
  n50[("ACTUALIZA scheduling.bookable_slots")]:::efecto
  n49 -->|"cada elemento"| n50
  n51["Llama a SchedulingCatalogRepository.createException"]:::llamada
  n50 --> n51
  n49 -->|"al terminar"| n51
  n52[("CREA scheduling.availability_exceptions")]:::efecto
  n51 --> n52
  n53(("200 Responde con éxito")):::ok
  n52 --> n53
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 37. POST /scheduling/resources/{id}/delay

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

#### 38. GET /scheduling/resources/{id}/exceptions

Listar las excepciones de disponibilidad de un recurso

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios; Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta agenda es de otro profesional: solo la administra quien atiende en ella.; ForbiddenException: No puede ver los bloqueos de esta agenda |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Recurso no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La ventana no es una fecha válida; PreconditionFailedException: La ventana debe empezar antes de terminar |
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
  n5{"Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())"}:::decision
  n4 --> n5
  n6(["422 PRECONDITION_FAILED La ventana no es una fecha válida"]):::error
  n5 -->|"sí"| n6
  n7{"!(from ‹ to)"}:::decision
  n5 -->|"no"| n7
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
  n13["Llama a CatalogAccess.mayAdministerResource"]:::llamada
  n11 -->|"no"| n13
  n14["Intenta"]:::intento
  n13 --> n14
  n15["Llama a CatalogAccess.assertActorResource"]:::llamada
  n14 --> n15
  n16{"!isOwnAgenda"}:::decision
  n15 --> n16
  n17(["403 FORBIDDEN Esta agenda es de otro profesional: solo la administra quien atiende en ella."]):::error
  n16 -->|"sí"| n17
  n18{"!mayRead && actor.patientProfileId !== undefined"}:::decision
  n16 -->|"no"| n18
  n19["Llama a SchedulingCatalogRepository.patientHasBookingWithResource"]:::llamada
  n18 -->|"sí"| n19
  n20[("LEE scheduling.appointment_bookings")]:::efecto
  n19 --> n20
  n21{"!mayRead"}:::decision
  n20 --> n21
  n18 -->|"no"| n21
  n22(["403 FORBIDDEN No puede ver los bloqueos de esta agenda"]):::error
  n21 -->|"sí"| n22
  n23["Llama a SchedulingCatalogRepository.findExceptionsByResourceInRange"]:::llamada
  n21 -->|"no"| n23
  n24[("LEE scheduling.availability_exceptions")]:::efecto
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

#### 39. POST /scheduling/resources/{id}/exceptions

Registrar una excepción de disponibilidad

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta agenda es de otro profesional: solo la administra quien atiende en ella.; ForbiddenException: Esta agenda es de otra organización: no puede ver ni cancelar sus citas. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Recurso no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Eligió «Otro» como motivo: escriba cuál es; PreconditionFailedException: La excepción debe empezar antes de terminar; PreconditionFailedException: Hay un paciente ya recibido en ese rato. Atiéndalo o cancele su cita desde la agenda antes de bloquear.; PreconditionFailedException: Tiene una cita confirmada en ese rato{first.resourceName ? ` en «${…}. Reprográmela primero o elija otro horario.; PreconditionFailedException: Ese rato tiene {n} {n === 1 ? 'cita' : 'citas'} con paciente. Confirme para cancelarlas y avisar a cada persona. |
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
  n14["Llama a CatalogAccess.assertActorResource"]:::llamada
  n12 -->|"no"| n14
  n15{"!isOwnAgenda"}:::decision
  n14 --> n15
  n16(["403 FORBIDDEN Esta agenda es de otro profesional: solo la administra quien atiende en ella."]):::error
  n15 -->|"sí"| n16
  n17{"!isAvailable && PRACTITIONER_PROFILE_TABLES.includes(resource.resourceRefType)"}:::decision
  n15 -->|"no"| n17
  n18["Llama a CreateExceptionUseCase.cancelBookingsOfBlock"]:::llamada
  n17 -->|"sí"| n18
  n19["Llama a SchedulingCatalogRepository.findSlotsOverlappingForUpdate"]:::llamada
  n18 --> n19
  n20[("LEE scheduling.bookable_slots")]:::efecto
  n19 --> n20
  n21["Llama a CatalogAccess.assertMayReadAgendaBookings"]:::llamada
  n20 --> n21
  n22{"!actor.tenantIds?.includes(resource.tenantId)"}:::decision
  n21 --> n22
  n23(["403 FORBIDDEN Esta agenda es de otra organización: no puede ver ni cancelar sus citas."]):::error
  n22 -->|"sí"| n23
  n24["Llama a BlockedBookingsCanceller.assertNobodyPresent"]:::llamada
  n22 -->|"no"| n24
  n25(["422 PRECONDITION_FAILED Hay un paciente ya recibido en ese rato. Atiéndalo o cancele su cita desde la agenda…"]):::error
  n24 --> n25
  n26{"elsewhere.length › 0"}:::decision
  n27(["422 PRECONDITION_FAILED Tiene una cita confirmada en ese rato{first.resourceName ? ` en «${…}. Reprográmela p…"]):::error
  n26 -->|"sí"| n27
  n28["Llama a BlockedBookingsCanceller.assertConfirmed"]:::llamada
  n26 -->|"no"| n28
  n29(["422 PRECONDITION_FAILED Ese rato tiene {n} {n === 1 ? 'cita' : 'citas'} con paciente. Confirme para cancelarl…"]):::error
  n28 --> n29
  n30["Llama a SchedulingCatalogRepository.createException"]:::llamada
  n17 -->|"no"| n30
  n31[("CREA scheduling.availability_exceptions")]:::efecto
  n30 --> n31
  n32{"!isAvailable"}:::decision
  n31 --> n32
  n33["Llama a SchedulingCatalogRepository.findOpenSlotsInWindow"]:::llamada
  n32 -->|"sí"| n33
  n34[("LEE scheduling.bookable_slots")]:::efecto
  n33 --> n34
  n35["Repite: por cada const slot de overlapping"]:::bucle
  n34 --> n35
  n36{"slot.statusConceptId === CONCEPTS.SLOT_OPEN && untouched"}:::decision
  n35 -->|"cada elemento"| n36
  n37[("ACTUALIZA scheduling.bookable_slots")]:::efecto
  n36 -->|"sí"| n37
  n38(("201 Responde con éxito")):::ok
  n37 --> n38
  n36 -->|"no"| n38
  n35 -->|"al terminar"| n38
  n32 -->|"no"| n38
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 40. GET /scheduling/resources/{id}/flexible-availability

Horas que se pueden pedir en un horario flexible

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios; Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: La agenda indicada pertenece a otra organización. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Agenda no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La ventana debe empezar antes de terminar.; PreconditionFailedException: Se pueden mirar hasta {MAX_QUERY_DAYS} días de una vez. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de consulta (400) · parámetros de consulta (400)…"}}:::acceso
  n1 --> n2
  n3["Llama a SchedulingFlexibleBookingService.availability"]:::llamada
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
  n9["Llama a SchedulingFlexibleBookingService.practitionerSite"]:::llamada
  n8 --> n9
  n10["Llama a SchedulingCatalogRepository.findResourceById"]:::llamada
  n9 --> n10
  n11[("LEE scheduling.schedulable_resources")]:::efecto
  n10 --> n11
  n12{"site === null || !PRACTITIONER_PROFILE_TABLES.includes(site.resourceRefType)"}:::decision
  n11 --> n12
  n13(["404 NOT_FOUND Agenda no encontrada"]):::error
  n12 -->|"sí"| n13
  n14{"!this.siteInScope(site, actor)"}:::decision
  n12 -->|"no"| n14
  n15(["403 FORBIDDEN La agenda indicada pertenece a otra organización."]):::error
  n14 -->|"sí"| n15
  n16["Llama a SchedulingFlexibleBookingService.offersOf"]:::llamada
  n14 -->|"no"| n16
  n17["Llama a SchedulingCatalogRepository.findFlexibleTemplatesOfResource"]:::llamada
  n16 --> n17
  n18[("LEE scheduling.schedule_templates · LEE scheduling.schedule_rules")]:::efecto
  n17 --> n18
  n19["Repite: por cada const { template, rules } de templates"]:::bucle
  n18 --> n19
  n20["Llama a SchedulingCatalogRepository.findPolicyById"]:::llamada
  n19 -->|"cada elemento"| n20
  n21[("LEE scheduling.booking_policies")]:::efecto
  n20 --> n21
  n22["Llama a SchedulingServiceAgendaService.practitionerBusyTime"]:::llamada
  n21 --> n22
  n19 -->|"al terminar"| n22
  n23["Llama a SchedulingOfferingsRepository.findLiveHoldsOfProfessional"]:::llamada
  n22 --> n23
  n24[("LEE scheduling.slot_holds · LEE scheduling.bookable_slots · LEE scheduling.schedulable_resources")]:::efecto
  n23 --> n24
  n25["Llama a SchedulingOfferingsRepository.findLiveServiceSlotsOfProfessional"]:::llamada
  n24 --> n25
  n26[("LEE scheduling.bookable_slots · LEE scheduling.schedulable_resources · LEE scheduling.practitioner_service_of…")]:::efecto
  n25 --> n26
  n27["Llama a SchedulingOfferingsRepository.findLiveFlexibleSlotsOfProfessional"]:::llamada
  n26 --> n27
  n28[("LEE scheduling.bookable_slots · LEE scheduling.schedulable_resources · LEE scheduling.schedule_templates · LE…")]:::efecto
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

#### 41. POST /scheduling/resources/{id}/flexible-holds

Retener una hora de un horario flexible

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: No cuenta con autorización de tutoría sobre el paciente indicado; ForbiddenException: La agenda indicada pertenece a otra organización. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Agenda no encontrada |
| 409 | `CONFLICT` | ConflictException: Esa hora ya no está disponible. Elija otra.; ConflictException: El paciente alcanzó el máximo de citas activas |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La hora pedida tiene que caer en un minuto entero.; PreconditionFailedException: Ese horario ya pasó.; PreconditionFailedException: Su vínculo con esta organización todavía está pendiente de aprobación. / Su vínculo con esta organización ya no está vigente.; PreconditionFailedException: Esa hora no está dentro del horario que atiende este profesional.; PreconditionFailedException: Esa cita empieza demasiado pronto: hay que pedirla con al menos {notice} minutos de anticipación.; PreconditionFailedException: Sólo se puede pedir con hasta {advance} días de anticipación. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a SchedulingFlexibleBookingService.placeHold"]:::llamada
  n2 --> n3
  n4{"dto.patientProfileId !== undefined && this.isPatientActor(actor)"}:::decision
  n3 --> n4
  n5["Llama a ProfilesPatientRepresentationAdapter.assertMayActForPatient"]:::llamada
  n4 -->|"sí"| n5
  n6["Llama a PatientRepresentationService.assertMayActForPatient"]:::llamada
  n5 --> n6
  n7(["403 FORBIDDEN No cuenta con autorización de tutoría sobre el paciente indicado"]):::error
  n6 --> n7
  n8{"!isWholeMinute(startAt)"}:::decision
  n4 -->|"no"| n8
  n9(["422 PRECONDITION_FAILED La hora pedida tiene que caer en un minuto entero."]):::error
  n8 -->|"sí"| n9
  n10["Transacción: transactional(…)"]:::transaccion
  n8 -->|"no"| n10
  n11["Llama a SchedulingFlexibleBookingService.practitionerSite"]:::llamada
  n10 --> n11
  n12["Llama a SchedulingCatalogRepository.findResourceById"]:::llamada
  n11 --> n12
  n13[("LEE scheduling.schedulable_resources")]:::efecto
  n12 --> n13
  n14{"site === null || !PRACTITIONER_PROFILE_TABLES.includes(site.resourceRefType)"}:::decision
  n13 --> n14
  n15(["404 NOT_FOUND Agenda no encontrada"]):::error
  n14 -->|"sí"| n15
  n16{"!this.siteInScope(site, actor)"}:::decision
  n14 -->|"no"| n16
  n17(["403 FORBIDDEN La agenda indicada pertenece a otra organización."]):::error
  n16 -->|"sí"| n17
  n18{"startAt.getTime() ‹= now.getTime()"}:::decision
  n16 -->|"no"| n18
  n19(["422 PRECONDITION_FAILED Ese horario ya pasó."]):::error
  n18 -->|"sí"| n19
  n20["Llama a SchedulingFlexibleBookingService.assertAffiliationCurrent"]:::llamada
  n18 -->|"no"| n20
  n21["Llama a PractitionerAffiliationGateService.evaluate"]:::llamada
  n20 --> n21
  n22["Llama a ProfilesAffiliationsAdapter.findOfPractitioner"]:::llamada
  n21 --> n22
  n23[("LEE profiles.practitioner_affiliations")]:::efecto
  n22 --> n23
  n24["Llama a ProfilesAffiliationsAdapter.tenantsOfSites"]:::llamada
  n23 --> n24
  n25[("LEE practice.practice_sites · LEE practice.practices")]:::efecto
  n24 --> n25
  n26(["422 PRECONDITION_FAILED Su vínculo con esta organización todavía está pendiente de aprobación. / Su vínculo c…"]):::error
  n25 --> n26
  n27["Llama a SchedulingFlexibleBookingService.offersOf"]:::llamada
  n28["Llama a SchedulingCatalogRepository.findFlexibleTemplatesOfResource"]:::llamada
  n27 --> n28
  n29[("LEE scheduling.schedule_templates · LEE scheduling.schedule_rules")]:::efecto
  n28 --> n29
  n30["Repite: por cada const { template, rules } de templates"]:::bucle
  n29 --> n30
  n31["Llama a SchedulingCatalogRepository.findPolicyById"]:::llamada
  n30 -->|"cada elemento"| n31
  n32[("LEE scheduling.booking_policies")]:::efecto
  n31 --> n32
  n33{"inBand.length === 0"}:::decision
  n32 --> n33
  n30 -->|"al terminar"| n33
  n34(["422 PRECONDITION_FAILED Esa hora no está dentro del horario que atiende este profesional."]):::error
  n33 -->|"sí"| n34
  n35["Llama a SchedulingServiceAgendaService.practitionerBusyTime"]:::llamada
  n33 -->|"no"| n35
  n36["Llama a SchedulingOfferingsRepository.findLiveHoldsOfProfessional"]:::llamada
  n35 --> n36
  n37[("LEE scheduling.slot_holds · LEE scheduling.bookable_slots · LEE scheduling.schedulable_resources")]:::efecto
  n36 --> n37
  n38["Llama a SchedulingOfferingsRepository.findLiveServiceSlotsOfProfessional"]:::llamada
  n37 --> n38
  n39[("LEE scheduling.bookable_slots · LEE scheduling.schedulable_resources · LEE scheduling.practitioner_service_of…")]:::efecto
  n38 --> n39
  n40["Llama a SchedulingOfferingsRepository.findLiveFlexibleSlotsOfProfessional"]:::llamada
  n39 --> n40
  n41[("LEE scheduling.bookable_slots · LEE scheduling.schedulable_resources · LEE scheduling.schedule_templates · LE…")]:::efecto
  n40 --> n41
  n42{"offer === undefined"}:::decision
  n41 --> n42
  n43(["409 CONFLICT Esa hora ya no está disponible. Elija otra."]):::error
  n42 -->|"sí"| n43
  n44["Llama a SchedulingFlexibleBookingService.assertPolicy"]:::llamada
  n42 -->|"no"| n44
  n45{"startAt.getTime() ‹ now.getTime() + notice * MS_PER_MINUTE"}:::decision
  n44 --> n45
  n46(["422 PRECONDITION_FAILED Esa cita empieza demasiado pronto: hay que pedirla con al menos {notice} minutos de a…"]):::error
  n45 -->|"sí"| n46
  n47{"advance !== undefined && startAt.getTime() › now.getTime() + advance * MS_PER_DAY"}:::decision
  n45 -->|"no"| n47
  n48(["422 PRECONDITION_FAILED Sólo se puede pedir con hasta {advance} días de anticipación."]):::error
  n47 -->|"sí"| n48
  n49["Llama a SchedulingFlexibleBookingService.assertPatientBelowCap"]:::llamada
  n47 -->|"no"| n49
  n50["Llama a SchedulingBookingsRepository.countActiveBookingsForPatient"]:::llamada
  n49 --> n50
  n51[("LEE scheduling.appointment_bookings")]:::efecto
  n50 --> n51
  n52{"active ›= policy.maxActivePerPatient"}:::decision
  n51 --> n52
  n53(["409 CONFLICT El paciente alcanzó el máximo de citas activas"]):::error
  n52 -->|"sí"| n53
  n54["Llama a SchedulingCatalogRepository.createSlot"]:::llamada
  n52 -->|"no"| n54
  n55[("CREA scheduling.bookable_slots")]:::efecto
  n54 --> n55
  n56["Llama a SchedulingBookingsRepository.createHold"]:::llamada
  n55 --> n56
  n57[("CREA scheduling.slot_holds")]:::efecto
  n56 --> n57
  n58(("201 Responde con éxito")):::ok
  n57 --> n58
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 42. POST /scheduling/resources/{id}/shift-slots

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

#### 43. GET /scheduling/resources/{id}/slots

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

#### 44. GET /scheduling/resources/{id}/templates

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

#### 45. POST /scheduling/resources/{id}/templates

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

#### 46. GET /scheduling/resources/{resourceId}/waitlist

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

#### 47. GET /scheduling/service-availability

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
  n37["Llama a SchedulingOfferingsRepository.findLiveFlexibleSlotsOfProfessional"]:::llamada
  n36 --> n37
  n38[("LEE scheduling.bookable_slots · LEE scheduling.schedulable_resources · LEE scheduling.schedule_templates · LE…")]:::efecto
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

#### 48. GET /scheduling/service-offerings

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

#### 49. POST /scheduling/service-offerings

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

#### 50. PATCH /scheduling/service-offerings/{id}

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

#### 51. POST /scheduling/service-offerings/{id}/holds

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
  n51["Llama a SchedulingOfferingsRepository.findLiveFlexibleSlotsOfProfessional"]:::llamada
  n50 --> n51
  n52[("LEE scheduling.bookable_slots · LEE scheduling.schedulable_resources · LEE scheduling.schedule_templates · LE…")]:::efecto
  n51 --> n52
  n53{"availableGroup === undefined"}:::decision
  n52 --> n53
  n54(["409 CONFLICT Ese horario ya no está disponible para este servicio. Elija otro."]):::error
  n53 -->|"sí"| n54
  n55["Llama a SchedulingServiceBookingService.assertPolicy"]:::llamada
  n53 -->|"no"| n55
  n56{"startAt.getTime() ‹ now.getTime() + group.minNoticeMinutes * MS_PER_MINUTE"}:::decision
  n55 --> n56
  n57(["422 PRECONDITION_FAILED Esa cita empieza demasiado pronto: hay que pedirla con al menos {group.minNoticeMinut…"]):::error
  n56 -->|"sí"| n57
  n58{"group.maxAdvanceDays !== undefined && startAt.getTime() › now.getTime() + group.maxAdvanceDays * MS_PER_DAY"}:::decision
  n56 -->|"no"| n58
  n59(["422 PRECONDITION_FAILED Sólo se puede pedir con hasta {group.maxAdvanceDays} días de anticipación."]):::error
  n58 -->|"sí"| n59
  n60["Llama a SchedulingOfferingsRepository.findCatalogItem"]:::llamada
  n58 -->|"no"| n60
  n61[("LEE billing.service_catalog")]:::efecto
  n60 --> n61
  n62["Llama a SchedulingServiceAgendaService.retract"]:::llamada
  n61 --> n62
  n63["Llama a SchedulingCatalogRepository.findOpenSlotsOfProfessionalInWindow"]:::llamada
  n62 --> n63
  n64[("LEE scheduling.schedulable_resources · LEE scheduling.bookable_slots")]:::efecto
  n63 --> n64
  n65["Repite: por cada const free de freeOnes"]:::bucle
  n64 --> n65
  n66[("ACTUALIZA scheduling.bookable_slots")]:::efecto
  n65 -->|"cada elemento"| n66
  n67["Llama a SchedulingCatalogRepository.createSlot"]:::llamada
  n66 --> n67
  n65 -->|"al terminar"| n67
  n68[("CREA scheduling.bookable_slots")]:::efecto
  n67 --> n68
  n69["Llama a SchedulingBookingsRepository.createHold"]:::llamada
  n68 --> n69
  n70[("CREA scheduling.slot_holds")]:::efecto
  n69 --> n70
  n71["… el resto del árbol (1 nodos) está en el JSON del inventario"]:::corte
  n70 --> n71
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 52. GET /scheduling/slots

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

#### 53. POST /scheduling/slots/{id}/holds

Reservar temporalmente un cupo del slot

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {SUPPORT_DENIED_MESSAGE}; ForbiddenException: El personal de apoyo no puede realizar esta operación. |
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
  n10["Llama a BookingAccess.assertSupportMayOnSlot"]:::llamada
  n8 -->|"no"| n10
  n11["Llama a SchedulingCatalogRepository.findResourceById"]:::llamada
  n10 --> n11
  n12[("LEE scheduling.schedulable_resources")]:::efecto
  n11 --> n12
  n13{"!resource"}:::decision
  n12 --> n13
  n14(["403 FORBIDDEN {SUPPORT_DENIED_MESSAGE}"]):::error
  n13 -->|"sí"| n14
  n15{"declaredTenantId !== undefined && declaredTenantId !== resource.tenantId"}:::decision
  n13 -->|"no"| n15
  n16(["403 FORBIDDEN {SUPPORT_DENIED_MESSAGE}"]):::error
  n15 -->|"sí"| n16
  n17["Llama a BookingAccess.assertSupportMayCreate"]:::llamada
  n15 -->|"no"| n17
  n18{"!this.supportPolicy"}:::decision
  n17 --> n18
  n19(["403 FORBIDDEN El personal de apoyo no puede realizar esta operación."]):::error
  n18 -->|"sí"| n19
  n20{"!answer.allowed"}:::decision
  n18 -->|"no"| n20
  n21(["403 FORBIDDEN {SUPPORT_DENIED_MESSAGE}"]):::error
  n20 -->|"sí"| n21
  n22{"refusal === 'BLOCKED'"}:::decision
  n20 -->|"no"| n22
  n23(["422 PRECONDITION_FAILED El slot está bloqueado"]):::error
  n22 -->|"sí"| n23
  n24{"refusal === 'RETRACTED'"}:::decision
  n22 -->|"no"| n24
  n25(["422 PRECONDITION_FAILED Ese horario ya no está disponible."]):::error
  n24 -->|"sí"| n25
  n26{"refusal === 'NO_CAPACITY'"}:::decision
  n24 -->|"no"| n26
  n27(["409 CONFLICT El slot no tiene cupos disponibles"]):::error
  n26 -->|"sí"| n27
  n28["Llama a SlotPolicyResolver.resolvePolicy"]:::llamada
  n26 -->|"no"| n28
  n29["Llama a SchedulingCatalogRepository.findTemplateById"]:::llamada
  n28 --> n29
  n30[("LEE scheduling.schedule_templates")]:::efecto
  n29 --> n30
  n31["Llama a SchedulingCatalogRepository.findPolicyById"]:::llamada
  n30 --> n31
  n32[("LEE scheduling.booking_policies")]:::efecto
  n31 --> n32
  n33{"timing !== null"}:::decision
  n32 --> n33
  n34(["422 PRECONDITION_FAILED Ese horario ya pasó. / Esa cita empieza demasiado pronto: hay que pedirla con al meno…"]):::error
  n33 -->|"sí"| n34
  n35{"policy?.maxActivePerPatient && dto.patientProfileId"}:::decision
  n33 -->|"no"| n35
  n36["Llama a SchedulingBookingsRepository.countActiveBookingsForPatient"]:::llamada
  n35 -->|"sí"| n36
  n37[("LEE scheduling.appointment_bookings")]:::efecto
  n36 --> n37
  n38{"active ›= policy.maxActivePerPatient"}:::decision
  n37 --> n38
  n39(["409 CONFLICT El paciente alcanzó el máximo de citas activas"]):::error
  n38 -->|"sí"| n39
  n40["Llama a SchedulingBookingsRepository.createHold"]:::llamada
  n38 -->|"no"| n40
  n35 -->|"no"| n40
  n41[("CREA scheduling.slot_holds")]:::efecto
  n40 --> n41
  n42[("ACTUALIZA scheduling.bookable_slots")]:::efecto
  n41 --> n42
  n43{"slot.remainingCapacity === 0"}:::decision
  n42 --> n43
  n44[("ACTUALIZA scheduling.bookable_slots")]:::efecto
  n43 -->|"sí"| n44
  n45(("201 Responde con éxito")):::ok
  n44 --> n45
  n43 -->|"no"| n45
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 54. DELETE /scheduling/templates/{id}

Retirar una plantilla de agenda y soltar sus cupos libres

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta agenda es de otro profesional: solo la administra quien atiende en ella.; ForbiddenException: Esta agenda es de otra organización: no puede ver ni cancelar sus citas. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Plantilla no encontrada; ResourceNotFoundException: Recurso de la plantilla no encontrado; ResourceNotFoundException: Cita no encontrada |
| 409 | `CONFLICT` | ConflictException: La cita ya está cancelada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Hay un paciente ya recibido en ese rato. Atiéndalo o cancele su cita desde la agenda antes de bloquear.; PreconditionFailedException: Puede cancelar hasta {Math.round(windowMinutes / 60)} horas antes del turno. Si ya no puede asistir, comuníquese con el consultorio. |
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
  n17{"options.cancelAffectedBookings"}:::decision
  n15 -->|"no"| n17
  n18["Llama a CatalogAccess.assertMayReadAgendaBookings"]:::llamada
  n17 -->|"sí"| n18
  n19{"!actor.tenantIds?.includes(resource.tenantId)"}:::decision
  n18 --> n19
  n20(["403 FORBIDDEN Esta agenda es de otra organización: no puede ver ni cancelar sus citas."]):::error
  n19 -->|"sí"| n20
  n21["Llama a SchedulingCatalogRepository.findSlotsOfTemplateForUpdate"]:::llamada
  n19 -->|"no"| n21
  n22[("LEE scheduling.bookable_slots")]:::efecto
  n21 --> n22
  n23["Llama a BlockedBookingsCanceller.describe"]:::llamada
  n22 --> n23
  n24["Llama a SchedulingCatalogRepository.findBookingsOfSlots"]:::llamada
  n23 --> n24
  n25[("LEE scheduling.appointment_bookings")]:::efecto
  n24 --> n25
  n26["Llama a SchedulingCatalogRepository.findBookingsOfSlots"]:::llamada
  n25 --> n26
  n27[("LEE scheduling.appointment_bookings")]:::efecto
  n26 --> n27
  n28["Llama a SchedulingNoticeRepository.findDisplayNameForProfile"]:::llamada
  n27 --> n28
  n29[("LEE profiles.persons")]:::efecto
  n28 --> n29
  n30["Llama a BlockedBookingsCanceller.assertNobodyPresent"]:::llamada
  n29 --> n30
  n31(["422 PRECONDITION_FAILED Hay un paciente ya recibido en ese rato. Atiéndalo o cancele su cita desde la agenda…"]):::error
  n30 --> n31
  n32{"affected.cancellable.length › 0"}:::decision
  n33["Llama a BlockedBookingsCanceller.cancelAll"]:::llamada
  n32 -->|"sí"| n33
  n34["Repite: por cada const booking de affected"]:::bucle
  n33 --> n34
  n35["Llama a CancelBookingUseCase.cancelInTransaction"]:::llamada
  n34 -->|"cada elemento"| n35
  n36{"!booking"}:::decision
  n35 --> n36
  n37(["404 NOT_FOUND Cita no encontrada"]):::error
  n36 -->|"sí"| n37
  n38{"booking.statusConceptId === CONCEPTS.BOOKING_CANCELLED"}:::decision
  n36 -->|"no"| n38
  n39(["409 CONFLICT La cita ya está cancelada"]):::error
  n38 -->|"sí"| n39
  n40{"blocksHolderCancellation(isHolderPatient, withinWindow, isNoShow)"}:::decision
  n38 -->|"no"| n40
  n41(["422 PRECONDITION_FAILED Puede cancelar hasta {Math.round(windowMinutes / 60)} horas antes del turno. Si ya no…"]):::error
  n40 -->|"sí"| n41
  n42[("ACTUALIZA scheduling.appointment_bookings")]:::efecto
  n40 -->|"no"| n42
  n43{"slot"}:::decision
  n42 --> n43
  n44[("ACTUALIZA scheduling.bookable_slots")]:::efecto
  n43 -->|"sí"| n44
  n45{"slot.scheduleTemplateId === undefined || slot.scheduleTemplateId === null || // P36: el turno de un horario f…"}:::decision
  n44 --> n45
  n46{"slot.statusConceptId !== CONCEPTS.SLOT_BLOCKED"}:::decision
  n45 -->|"no"| n46
  n47[("ACTUALIZA scheduling.bookable_slots")]:::efecto
  n46 -->|"sí"| n47
  n48["Llama a SchedulingCatalogRepository.findBookingsOfTemplate"]:::llamada
  n45 -->|"sí"| n48
  n47 --> n48
  n46 -->|"no"| n48
  n43 -->|"no"| n48
  n34 -->|"al terminar"| n48
  n32 -->|"no"| n48
  n17 -->|"no"| n48
  n49[("LEE scheduling.bookable_slots · LEE scheduling.appointment_bookings · LEE scheduling.appointment_bookings · L…")]:::efecto
  n48 --> n49
  n50["Llama a SchedulingCatalogRepository.retireTemplate"]:::llamada
  n49 --> n50
  n51["Llama a SchedulingCatalogRepository.findSlotsOfTemplateForUpdate"]:::llamada
  n50 --> n51
  n52[("LEE scheduling.bookable_slots")]:::efecto
  n51 --> n52
  n53{"slots.length › 0"}:::decision
  n52 --> n53
  n54[("LEE scheduling.appointment_bookings · LEE scheduling.booking_reschedules")]:::efecto
  n53 -->|"sí"| n54
  n55["Repite: por cada const slot de slots"]:::bucle
  n54 --> n55
  n56{"untouchable.has(slot.id) && slot.statusConceptId !== keptSlotStatusConceptId"}:::decision
  n55 -->|"cada elemento"| n56
  n57[("ACTUALIZA scheduling.bookable_slots")]:::efecto
  n56 -->|"sí"| n57
  n58{"freeOnes.length › 0"}:::decision
  n57 --> n58
  n56 -->|"no"| n58
  n55 -->|"al terminar"| n58
  n59[("BORRA scheduling.slot_holds · BORRA scheduling.bookable_slots")]:::efecto
  n58 -->|"sí"| n59
  n60[("LEE scheduling.schedule_templates")]:::efecto
  n59 --> n60
  n58 -->|"no"| n60
  n53 -->|"no"| n60
  n61{"template"}:::decision
  n60 --> n61
  n62[("ACTUALIZA scheduling.schedule_templates")]:::efecto
  n61 -->|"sí"| n62
  n63(("200 Responde con éxito")):::ok
  n62 --> n63
  n61 -->|"no"| n63
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 55. PATCH /scheduling/templates/{id}

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

#### 56. POST /scheduling/templates/{id}/generate-slots

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
  n21["Llama a SchedulingPlaceRepository.resolve"]:::llamada
  n19 -->|"no"| n21
  n17 -->|"no"| n21
  n22[("LEE practice.practitioner_role_assignments")]:::efecto
  n21 --> n22
  n23{"roles.length › 0"}:::decision
  n22 --> n23
  n24[("LEE practice.practitioner_location_assignments")]:::efecto
  n23 -->|"sí"| n24
  n25{"practiceId && serviceConceptId"}:::decision
  n24 --> n25
  n23 -->|"no"| n25
  n26[("LEE practice.healthcare_services")]:::efecto
  n25 -->|"sí"| n26
  n27["Llama a SchedulingCatalogRepository.findRulesByTemplate"]:::llamada
  n26 --> n27
  n25 -->|"no"| n27
  n28[("LEE scheduling.schedule_rules")]:::efecto
  n27 --> n28
  n29["Llama a SchedulingCatalogRepository.findSlotsByTemplateInRange"]:::llamada
  n28 --> n29
  n30[("LEE scheduling.bookable_slots")]:::efecto
  n29 --> n30
  n31["Repite: por cada const rule de rules"]:::bucle
  n30 --> n31
  n32["Repite: por cada const day de matchingLocalDays(from, to, rule.dayOfWeek, zone)"]:::bucle
  n31 -->|"cada elemento"| n32
  n33["Repite: ciclo for"]:::bucle
  n32 -->|"cada elemento"| n33
  n34["Llama a SchedulingCatalogRepository.createSlot"]:::llamada
  n33 -->|"cada elemento"| n34
  n35[("CREA scheduling.bookable_slots")]:::efecto
  n34 --> n35
  n36(("201 Responde con éxito")):::ok
  n35 --> n36
  n33 -->|"al terminar"| n36
  n32 -->|"al terminar"| n36
  n31 -->|"al terminar"| n36
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 57. GET /scheduling/templates/{id}/live-bookings

Listar las citas vivas de una plantilla antes de retirarla

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta agenda es de otro profesional: solo la administra quien atiende en ella.; ForbiddenException: Esta agenda es de otra organización: no puede ver ni cancelar sus citas. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Plantilla no encontrada; ResourceNotFoundException: Recurso de la plantilla no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a SchedulingCatalogService.listTemplateLiveBookings"]:::llamada
  n2 --> n3
  n4["Llama a ListTemplateLiveBookingsUseCase.execute"]:::llamada
  n3 --> n4
  n5["Llama a SchedulingCatalogRepository.findTemplateById"]:::llamada
  n4 --> n5
  n6[("LEE scheduling.schedule_templates")]:::efecto
  n5 --> n6
  n7{"!template"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Plantilla no encontrada"]):::error
  n7 -->|"sí"| n8
  n9["Llama a SchedulingCatalogRepository.findResourceById"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE scheduling.schedulable_resources")]:::efecto
  n9 --> n10
  n11{"!resource"}:::decision
  n10 --> n11
  n12(["404 NOT_FOUND Recurso de la plantilla no encontrado"]):::error
  n11 -->|"sí"| n12
  n13["Llama a CatalogAccess.assertActorResource"]:::llamada
  n11 -->|"no"| n13
  n14{"!isOwnAgenda"}:::decision
  n13 --> n14
  n15(["403 FORBIDDEN Esta agenda es de otro profesional: solo la administra quien atiende en ella."]):::error
  n14 -->|"sí"| n15
  n16["Llama a CatalogAccess.assertMayReadAgendaBookings"]:::llamada
  n14 -->|"no"| n16
  n17{"!actor.tenantIds?.includes(resource.tenantId)"}:::decision
  n16 --> n17
  n18(["403 FORBIDDEN Esta agenda es de otra organización: no puede ver ni cancelar sus citas."]):::error
  n17 -->|"sí"| n18
  n19["Llama a SchedulingCatalogRepository.findSlotsOfTemplate"]:::llamada
  n17 -->|"no"| n19
  n20[("LEE scheduling.bookable_slots")]:::efecto
  n19 --> n20
  n21["Llama a BlockedBookingsCanceller.describe"]:::llamada
  n20 --> n21
  n22["Llama a SchedulingCatalogRepository.findBookingsOfSlots"]:::llamada
  n21 --> n22
  n23[("LEE scheduling.appointment_bookings")]:::efecto
  n22 --> n23
  n24["Llama a SchedulingCatalogRepository.findBookingsOfSlots"]:::llamada
  n23 --> n24
  n25[("LEE scheduling.appointment_bookings")]:::efecto
  n24 --> n25
  n26["Llama a SchedulingNoticeRepository.findDisplayNameForProfile"]:::llamada
  n25 --> n26
  n27[("LEE profiles.persons")]:::efecto
  n26 --> n27
  n28(("200 Responde con éxito")):::ok
  n27 --> n28
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 58. POST /scheduling/templates/{id}/reactivate

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

#### 59. GET /scheduling/waitlist

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

#### 60. POST /scheduling/waitlist

Inscribir a un paciente en la lista de espera

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {SUPPORT_DENIED_MESSAGE}; ForbiddenException: El personal de apoyo no puede realizar esta operación.; ForbiddenException: Sólo el titular y el personal de agenda pueden ver esta lista de espera. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Slot no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El cupo indicado no es de la agenda indicada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a SchedulingWaitlistService.enroll"]:::llamada
  n2 --> n3
  n4["Llama a PostgresWaitlistAdapter.findSlotPlacement"]:::llamada
  n3 --> n4
  n5["Transacción: read(…)"]:::transaccion
  n4 --> n5
  n6[("LEE scheduling.bookable_slots")]:::efecto
  n5 --> n6
  n7{"dto.bookableSlotId && !slot"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Slot no encontrado"]):::error
  n7 -->|"sí"| n8
  n9{"slot && dto.resourceId && dto.resourceId !== slot.resourceId"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED El cupo indicado no es de la agenda indicada"]):::error
  n9 -->|"sí"| n10
  n11["Llama a PostgresWaitlistAdapter.findResourceOwner"]:::llamada
  n9 -->|"no"| n11
  n12["Transacción: read(…)"]:::transaccion
  n11 --> n12
  n13[("LEE scheduling.schedulable_resources")]:::efecto
  n12 --> n13
  n14{"mayBeSupport && isSupportActor(actor, owner?.tenantId ?? dto.tenantId)"}:::decision
  n13 --> n14
  n15{"owner && owner.tenantId !== dto.tenantId"}:::decision
  n14 -->|"sí"| n15
  n16(["403 FORBIDDEN {SUPPORT_DENIED_MESSAGE}"]):::error
  n15 -->|"sí"| n16
  n17["Llama a BookingAccess.assertSupportMayCreate"]:::llamada
  n15 -->|"no"| n17
  n18["Llama a BookingAccess.assertSupportInActiveTenant"]:::llamada
  n17 --> n18
  n19{"!withinScope"}:::decision
  n18 --> n19
  n20(["403 FORBIDDEN {SUPPORT_DENIED_MESSAGE}"]):::error
  n19 -->|"sí"| n20
  n21{"!this.supportPolicy"}:::decision
  n19 -->|"no"| n21
  n22(["403 FORBIDDEN El personal de apoyo no puede realizar esta operación."]):::error
  n21 -->|"sí"| n22
  n23{"!answer.allowed"}:::decision
  n21 -->|"no"| n23
  n24(["403 FORBIDDEN {SUPPORT_DENIED_MESSAGE}"]):::error
  n23 -->|"sí"| n24
  n25["Llama a SchedulingWaitlistService.assertMaySeePatient"]:::llamada
  n14 -->|"no"| n25
  n26(["403 FORBIDDEN Sólo el titular y el personal de agenda pueden ver esta lista de espera."]):::error
  n25 --> n26
  n27["Transacción: transaction(…)"]:::transaccion
  n23 -->|"no"| n27
  n28["Llama a PostgresWaitlistAdapter.enroll"]:::llamada
  n27 --> n28
  n29["Transacción: write(…)"]:::transaccion
  n28 --> n29
  n30["Llama a SchedulingBookingsRepository.createWaitlistEntry"]:::llamada
  n29 --> n30
  n31[("CREA scheduling.waitlist_entries")]:::efecto
  n30 --> n31
  n32(("201 Responde con éxito")):::ok
  n31 --> n32
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 61. GET /tenants/{tenantId}/agenda

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
