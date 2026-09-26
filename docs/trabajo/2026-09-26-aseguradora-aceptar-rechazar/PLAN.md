# PLAN — La aseguradora acepta y rechaza (por ítem) las solicitudes de aprobación

**Origen.** Registro de procesos (Google Doc «Pestaña 1»), MÓDULO ASEGURADORA ·
«Recepción de solicitudes de órdenes de Aprobación» · 1-4, y MÓDULO PACIENTE ·
«Simulación con un paciente si cuenta con seguro médico» (aprobación parcial y
completa de receta, laboratorio y análisis clínicos):

> Cuando se recepcione una solicitud de APROBACIÓN necesitamos que la APP
> responda con APROBADO y NO APROBADO indicando por qué no está APROBADO
> según la cláusula del contrato…

**Estado previo (medido en código).**
- El modelo ya admitía una determinación por ítem (`prior_authorization_item_id`),
  pero no tenía dónde guardar la cláusula.
- La API decidía la solicitud entera: `CreateDeterminationDto` sin ítem, sin
  motivo y sin cláusula.
- No había lectura (GET) de solicitudes para la aseguradora.
- El frontend no tenía ninguna pantalla.

## H1 — Modelo: la determinación guarda la cláusula (v4.2.31)
- H1.S1.M1 · `policy_clause_reference varchar` y `denial_rationale text` en
  `insurance.prior_authorization_determinations`: DDL, diagrama y patch idempotente.
  - **CA:** dada una base con v4.2.30, cuando se aplica el patch dos veces,
    entonces existen las dos columnas y la segunda pasada no falla.
  - **DoD:** `psql -f patch` ×2 sobre PG16 con `apply_all.sql` + `apply_deferred.sql`,
    y el diff DDL ↔ columnas vivas queda vacío.
- H1.S1.M2 · Espejo en `database/SQL` de la API, y la entidad MikroORM gana los
  dos campos.

## H2 — API: decidir por ítem
- H2.S1.M1 · `ItemDeterminationDto` (APPROVED/DENIED, cláusula obligatoria al
  denegar, ≤255) y `CreateDeterminationDto.items`. Sin `items` se mantiene la
  forma histórica.
  - **CA:** dado un ítem DENIED sin cláusula, cuando se envía, entonces 400 y no
    se escribe nada.
- H2.S1.M2 · El servicio valida que cada ítem se decida una sola vez y que el
  aprobado sea ≤ lo solicitado. Deriva la global (APPROVED/PARTIAL/DENIED) y
  escribe una fila global más una por ítem, en la misma versión.
  - **CA:** si falta un ítem, está repetido o es ajeno, o la global contradice
    los ítems, entonces 422 y no se escribe nada.
  - **DoD:** `yarn test prior-auth-linked.service.spec.ts`.

## H3 — API: bandeja de la aseguradora
- H3.S1.M1 · `GET /prior-authorization-requests/inbox?status=`, con alcance =
  aseguradora del tenant activo administrado (cobertura → plan → producto),
  filtrado dentro de la consulta.
- H3.S1.M2 · `GET /prior-authorization-requests/:id` con los ítems y la decisión
  vigente por ítem. Una solicitud ajena o inexistente da el mismo 403.
  - **DoD:** `prior-auth-read.service.spec.ts`, y la consulta SQL ejecutada
    contra PG16 con dos aseguradoras.

## H4 — Verificación extremo a extremo (HTTP → PostgreSQL)
- H4.S1.M1 · Caso nuevo en `patient-coverage-copays.int-spec.ts`: bandeja,
  aislamiento entre aseguradoras, 400 sin cláusula, 403 ajena, parcial
  persistida, recarga y 422 al repetir.

## H5 — Contrato
- H5.S1.M1 · Regenerar `openapi.{json,yaml}` y `openapi/endpoints/*`, y correr
  `check-breaking` y `redocly lint`.

Fuera de alcance, anotado:
- Mostrarle la respuesta al paciente (el enlace del módulo paciente).
- Que `validatePriorAuthorization` del reclamo exija una autorización aprobada.
- La respuesta automática por reglas de póliza.
