# Módulo Medical Groups — Grupos médicos (FT-21)

Un **grupo médico** es un evento de equipo alrededor de un servicio del catálogo:
un roster de profesionales por cargo o función, el pago acordado por cargo, un
paciente y un diagnóstico opcionales, y un ciclo de vida propio que termina en un
expediente inmutable.

Persiste en el esquema `medical_groups` (`groups` y `group_members`). El modelo
entró por el patch `database/SQL/patches/2026-09-04_v426_medical_groups.sql`, que
declara su desvío del recorrido `.puml → SQL → BD → ORM`.

## Rutas HTTP y alcance (medido)

<!-- Medido el 2026-10-08 sobre origin/dev (dae4fd68). Repetir con:
  find src/modules/medical_groups -name '*.controller.ts' | wc -l
  find src/modules/medical_groups -name '*.controller.ts' -exec grep -hE "^\s*@(Get|Post|Put|Patch|Delete)\(" {} + | wc -l
  find src/modules/medical_groups -name '*.entity.ts' | wc -l
  find src/modules/medical_groups -name '*.service.ts' | wc -l
La tabla sale de los decoradores `@Controller`/`@Get`/`@Post`/`@Put`/`@Patch`/`@Delete`, `@Roles` y `@Public`. -->

El módulo tiene **1 controller, 8 rutas HTTP, 2 entidades y 1 servicio**. La columna *Acceso* sale del código: `pública` = `@Public()`; un rol = `@Roles(...)`; `sesión` = sin ninguno de los dos, o sea que sólo exige sesión autenticada (guards globales `JwtAuthGuard`, `TenantScopeGuard`, `RolesGuard`, `VerifiedIdentityGuard`). La autorización por recurso puede vivir además en el servicio y no se refleja acá.

Si una tabla narrativa más abajo difiere de ésta (prefijo del controller omitido, sufijos `:accion` de la spec en lugar de sub-rutas), manda ésta: sale del código.

Importa (`PracticeModule`, `ClinicalModule`).

Entidades (`tableName`, 2 de 2 archivos `*.entity.ts`): `group_members`, `groups`.

| Método y ruta | Acceso | Controller |
| --- | --- | --- |
| `GET /medical-groups` | PRACTITIONER, CLINICIAN | `medical-groups` |
| `GET /medical-groups/patients/:patientProfileId/conditions` | PRACTITIONER, CLINICIAN | `medical-groups` |
| `GET /medical-groups/:id` | PRACTITIONER, CLINICIAN | `medical-groups` |
| `POST /medical-groups` | PRACTITIONER, CLINICIAN | `medical-groups` |
| `POST /medical-groups/:id/members/:memberId/respond` | PRACTITIONER, CLINICIAN | `medical-groups` |
| `POST /medical-groups/:id/reschedule-requests` | PRACTITIONER, CLINICIAN | `medical-groups` |
| `POST /medical-groups/:id/reschedule-requests/respond` | PRACTITIONER, CLINICIAN | `medical-groups` |
| `PATCH /medical-groups/:id/exercise-notes` | PRACTITIONER, CLINICIAN | `medical-groups` |

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
