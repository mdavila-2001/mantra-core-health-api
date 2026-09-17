<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/medical_groups/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `medical_groups`

**Fuente:** [`src/modules/medical_groups/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/medical_groups/README.md)
· 1 controllers · 1 services · 2 repositories · 2 entidades · 1 DTO

---

# Módulo Medical Groups — Grupos médicos (FT-21)

Un **grupo médico** es un evento de equipo alrededor de un servicio del catálogo:
un roster de profesionales por cargo o función, el pago acordado por cargo, un
paciente y un diagnóstico opcionales, y un ciclo de vida propio que termina en un
expediente inmutable.

Persiste en el esquema `medical_groups` (`groups` y `group_members`). El modelo
entró por el patch `database/SQL/patches/2026-09-04_v426_medical_groups.sql`, que
declara su desvío del recorrido `.puml → SQL → BD → ORM`.

## Endpoints

Todos exigen rol `PRACTITIONER` o `CLINICIAN` y una cuenta con perfil
profesional.

| Método | Ruta | Qué hace |
|---|---|---|
| `GET` | `/medical-groups` | Lista por pestaña: `historico`, `enviadas` o `recibidas`. |
| `GET` | `/medical-groups/patients/:patientProfileId/conditions` | Diagnósticos del paciente para el selector del formulario. |
| `GET` | `/medical-groups/:id` | Consulta un grupo (formulario de sólo lectura). |
| `POST` | `/medical-groups` | Crea un grupo e invita al equipo. |
| `POST` | `/medical-groups/:id/members/:memberId/respond` | El invitado acepta o rechaza su cargo. |
| `POST` | `/medical-groups/:id/reschedule-requests` | Propone un cambio de horario. |
| `POST` | `/medical-groups/:id/reschedule-requests/respond` | El creador resuelve el cambio propuesto. |
| `PATCH` | `/medical-groups/:id/exercise-notes` | Carga o corrige las notas del procedimiento. |

## Ciclo de vida

| Estado | Significa |
|---|---|
| `PENDING_TEAM` | Hay invitaciones sin responder. |
| `SCHEDULED` | El equipo aceptó; la cita está programada. |
| `RESCHEDULE_PENDING` | Un integrante propuso otro horario y el creador no respondió. |
| `CLOSED` | El expediente está cerrado y ya no admite cambios. |

- Cuando el propio creador propone el cambio de horario, se aplica directo: no
  tiene a quién pedirle aprobación.
- Las notas del procedimiento sólo se cargan **después** de la cita y dentro de
  una ventana de 7 días. Pasada la ventana el grupo se cierra y responde `422`.

## Reglas de acceso

- **El servicio tiene que ser de una práctica propia.** Un servicio de otra
  práctica responde `404`, nunca `403`, para no revelar que existe.
- **El diagnóstico exige poder leer la historia del paciente**, con el mismo
  control que `GET /clinical/patients/:id/summary`. Elegir un diagnóstico sin
  paciente responde `422`.
- **Quien no es el invitado** recibe `404` al responder una invitación, para que
  no distinga «no es tuya» de «no existe».
- Sólo el creador resuelve un cambio de horario.

