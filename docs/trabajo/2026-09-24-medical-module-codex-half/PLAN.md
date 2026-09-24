# Plan — ejecución Codex del módulo Médico: identidad fiscal

- Fecha: 2026-09-24 · Repo afectado: `mantra-core-health-api` · Predecesor: `2026-09-24-medical-module-execution`
- Resultado observable: el profesional puede guardar su NIT y razón social desde su perfil, recargar y obtener exactamente los mismos datos; cambiar uno conserva el otro y quitar el NIT conserva el historial.
- Kill-test: `PATCH /profiles/practitioners/me` con `taxId` y `taxHolderName` devuelve 400 o la lectura posterior no contiene ambos valores.

## Alcance

- IN: DTO de edición propia, lectura propia, persistencia histórica en `common.identifiers`, contrato OpenAPI, pruebas dirigidas y registro del bloqueo de CI de MinIO.
- OUT: entidad fiscal societaria, documentos legales, cambios de DDL, frontend, pagos, aseguradoras y corrección general del workflow de documentación.
- Ambigüedades registradas: este tramo implementa el NIT personal ya expuesto por la pantalla y reutiliza el contrato existente de Paciente; la entidad fiscal empresarial de MED-06 queda para el contrato funcional pendiente.

## H1 — Identidad fiscal editable del profesional

**CA:** Dado un profesional autenticado, cuando guarda NIT y razón social, entonces la API acepta el cuerpo, conserva historial y devuelve ambos valores al recargar.
**DoD:** spec dirigido RED→GREEN, recorrido HTTP con PostgreSQL, suite de `profiles`, typecheck, lint dirigido, OpenAPI válido y `git diff --check`.
**Estado:** HECHO — implementación, recorrido real y publicación en PR #453

### H1.S1 — Contrato, persistencia y lectura

**CA:** Dado un identificador fiscal vigente, cuando cambia sólo número o titular, entonces el dato omitido se conserva; una cadena vacía en el número cierra la fila sin abrir otra.
**DoD:** `corepack yarn test --runInBand src/modules/profiles/services/profiles-practitioners.service.spec.ts` termina en verde con casos de escritura y relectura.
**Estado:** HECHO — implementación, recorrido real y publicación en PR #453

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H1.S1.M1 | Escribir casos RED de NIT y razón social en el servicio profesional. | Sin implementación, la lectura no devuelve los campos y la escritura no crea identificador fiscal. | Spec dirigido falla por la ausencia del comportamiento. | HECHO — 3 fallos nuevos / 141 aprobadas |
| H1.S1.M2 | Agregar los campos al DTO, persistirlos históricamente y devolverlos sólo en la lectura propia. | Guardar ambos, cambiar uno y borrar el NIT producen el estado esperado. | Spec dirigido en verde. | HECHO — 144/144 |
| H1.S1.M3 | Actualizar y validar OpenAPI y gates del diff. | El contrato publicado contiene ambos campos y no hay errores nuevos. | Typecheck, lint dirigido, OpenAPI lint y `git diff --check` en 0. | HECHO |
| H1.S1.M4 | Probar el flujo por HTTP con PostgreSQL real. | Dos PATCH, relectura, historial y privacidad pública quedan demostrados. | Spec de integración dirigido en verde. | HECHO — 6/6 |
| H1.S1.M5 | Documentar el resultado y publicar el commit en el PR #453. | El PR contiene el cambio y el reporte distingue el bloqueo externo de CI. | Commit y push; estado de checks registrado. | HECHO — `27055a6d` publicado |

## H2 — Diagnóstico del CI del PR #453

**CA:** Dado el job `docs` fallido, cuando se revisa su log, entonces queda identificada la causa y su relación con el diff médico.
**DoD:** log del run 36041223938 citado literalmente en el reporte y comparación de `.github/workflows` contra `origin/dev`.
**Estado:** HECHO

### H2.S1 — MinIO histórico no disponible

**CA:** El diagnóstico identifica el recurso exacto que falla sin introducir una imagen no oficial en el PR médico.
**DoD:** `git diff --name-only origin/dev...HEAD -- .github/workflows` vacío y error `unauthorized` registrado.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H2.S1.M1 | Inspeccionar el job y comparar el workflow. | La falla ocurre antes de instalar dependencias y el workflow no pertenece al diff. | `gh run view ... --log-failed` más diff vacío. | HECHO |

## H3 — Aislamiento de tenant en la recepción sin turno

**CA:** Dado un agente de agenda operando en el tenant A, cuando envía el UUID de un recurso del tenant B a la cita directa o al walk-in, entonces la API responde 403 antes de crear cita o encuentro y la transacción no conserva el paciente provisional.
**DoD:** caso unitario RED→GREEN en `SchedulingBookingsService`, recorrido HTTP con PostgreSQL para el walk-in, suite dirigida, typecheck, lint dirigido y `git diff --check`.
**Estado:** HECHO — prueba unitaria, recorrido HTTP real, gates y publicación en PR #453

### H3.S1 — Recurso limitado al tenant activo

**CA:** El tenant del recurso coincide con el tenant resuelto por el request; sólo `SUPERADMIN` puede operar sin ese límite.
**DoD:** la cita directa conserva sus permisos dentro del tenant y rechaza el recurso de otro tenant con `ForbiddenException`.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H3.S1.M1 | Escribir el caso RED de un agente del tenant A sobre un recurso del tenant B. | La implementación actual deja avanzar el flujo; la nueva aserción espera 403 antes de consultar al paciente. | El spec dirigido falla por ausencia del aislamiento. | HECHO — 1 fallo nuevo / 154 aprobadas |
| H3.S1.M2 | Comparar el recurso con el tenant activo antes de autorizar la agenda. | Un agente sólo opera agendas del contexto resuelto; `SUPERADMIN` conserva el alcance de plataforma. | Spec dirigido en verde. | HECHO — 155/155 |
| H3.S1.M3 | Probar por HTTP el rollback del walk-in cruzado. | La respuesta es 403 y no queda el identificador del paciente provisional. | Integración FX-10 sobre PostgreSQL real en verde. | HECHO — 3/3 |
| H3.S1.M4 | Ejecutar gates, documentar y publicar. | No aparecen fallos nuevos y el PR contiene implementación más evidencia. | Typecheck, lint, `git diff --check`, commit y push. | HECHO — 21 suites / 493 pruebas de scheduling; publicación en PR #453 |

## H4 — Participantes autorizados en la sesión virtual

**CA:** Dado un encuentro clínico, sólo su paciente o un profesional participante pueden unirse; sólo un profesional participante puede crear o finalizar la sesión. Un tercero y un actor de otro tenant reciben 403 sin cambiar el estado.
**DoD:** casos RED→GREEN del servicio y metadata del controlador, recorrido HTTP con PostgreSQL, suite dirigida, typecheck, lint dirigido y `git diff --check`.
**Estado:** HECHO — autorización por participante, recorrido HTTP y publicación en PR #453

### H4.S1 — Autorización por relación con el encuentro

**CA:** La decisión se toma con `encounter.patientProfileId`, `primaryPractitionerId`, participantes activos y tenant custodio; el rol solo abre la ruta y no reemplaza esa relación.
**DoD:** create/join/end cubren actor propio, tercero y paciente; `join` admite el rol `PATIENT` en el controlador.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H4.S1.M1 | Escribir casos RED de tercero y paciente titular. | Hoy el tercero cambia el estado y el paciente ni siquiera supera el `RolesGuard`. | Specs dirigidos fallan por falta de autorización y metadata. | HECHO — 2 fallos nuevos / 9 aprobadas |
| H4.S1.M2 | Cargar el encuentro y comprobar tenant y participación antes de cada transición. | Create/end exigen profesional participante; join acepta también al paciente titular; un tercero recibe 403. | Specs dirigidos en verde. | HECHO — 18/18 |
| H4.S1.M3 | Probar el flujo por HTTP con PostgreSQL real. | Profesional crea, paciente titular se une, tercero no finaliza ni muta la sesión. | Integración dirigida en verde. | HECHO — 1/1 |
| H4.S1.M4 | Ejecutar gates, documentar y publicar. | No hay regresiones nuevas y el PR contiene la evidencia. | Suite de `clinical_ext`, typecheck, lint, `git diff --check`, commit y push. | HECHO — 15 suites / 84 pruebas; publicación en PR #453 |

## Riesgos y bloqueos previstos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| El workflow consume una imagen histórica de MinIO retirada. | El check `docs` seguirá bloqueado aunque el cambio médico sea correcto. | Mantener el diagnóstico separado y abrir una corrección de infraestructura con fuente oficial, sin contaminar este diff. |
| El resumen propio y la ficha pública comparten DTO. | Podría filtrarse el NIT en la guía. | Leer y asignar NIT únicamente cuando `incluyeContacto` sea verdadero. |
| Cambiar un solo campo puede borrar el otro. | Corrupción de identidad fiscal. | Reutilizar la semántica histórica ya probada en Paciente y cubrir cambios parciales. |
| La búsqueda por UUID no queda acotada si RLS está desactivado. | Un rol de mostrador puede comprometer una agenda de otra organización. | Comparar siempre `resource.tenantId` con el tenant activo ya validado por el guard. |
| `virtual_encounters` no contiene `tenant_id` ni participante. | Un UUID conocido puede saltar tenant o relación clínica. | Resolver siempre el encuentro padre y autorizar contra su custodio y participantes antes de mutar. |
