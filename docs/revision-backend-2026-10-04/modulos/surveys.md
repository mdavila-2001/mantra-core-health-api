# Revisión backend — `surveys`

Fecha: 2026-10-05. Alcance revisado: controladores, DTOs, servicios, repositorios,
entidades, pruebas unitarias y DDL `database/SQL/65_surveys`.

## Resultado

Se confirmó una falla crítica de aislamiento en el autoservicio del paciente y una
falla alta de integridad por restricciones que el módulo declara pero que el DDL no
materializa. `corepack yarn test src/modules/surveys --runInBand --silent` aprobó
**3 suites y 65 pruebas**.

## Hallazgos

### SURV-01 — Crítica — El autoservicio de paciente no limita invitaciones al tenant activo

`GET /surveys/me/invitations`, `GET /surveys/me/invitations/:id` y `POST
/surveys/me/invitations/:id/responses` toman el paciente del claim, pero ninguno
de los dos primeros obtiene el tenant de la petición
([`surveys-responses.service.ts`](../../../src/modules/surveys/services/surveys-responses.service.ts#L67-L109)).
La consulta de lista filtra sólo por `patientProfileId`
([`surveys-responses.service.ts`](../../../src/modules/surveys/services/surveys-responses.service.ts#L279-L283),
[`invitations.repository.ts`](../../../src/modules/surveys/repositories/invitations.repository.ts#L67-L75));
la carga puntual verifica sólo ese mismo perfil
([`surveys-responses.service.ts`](../../../src/modules/surveys/services/surveys-responses.service.ts#L285-L300)).

Por ello, un paciente que tenga atenciones en dos organizaciones puede, dentro del
contexto de una de ellas, listar o abrir los cuestionarios emitidos por la otra.
El perfil de paciente es global y no lleva `tenant_id`
([`05_profiles/02_tables.sql`](../../../database/SQL/05_profiles/02_tables.sql#L66-L81)),
de modo que la igualdad del perfil no prueba la pertenencia de la invitación al
tenant seleccionado.
En el envío, `submitResponse` sí lee el tenant actual, pero no lo compara con la
invitación y escribe ese valor en la respuesta
([`surveys-responses.service.ts`](../../../src/modules/surveys/services/surveys-responses.service.ts#L117-L159)).
La respuesta puede quedar asociada al tenant de la sesión mientras su invitación,
versión y atención pertenecen a otro tenant. Las FK independientes a tenant y
paciente no expresan esa co-pertenencia
([`90_fk_deferred.sql`](../../../database/SQL/65_surveys/90_fk_deferred.sql#L110-L164)).

**Plan de corrección:** obtener `requireTenantId()` en las tres operaciones de
autoservicio; extender `listByPatient` y `loadOwnInvitation` con `tenantId` y
consultar por ambos campos. Rechazar la invitación de otro tenant con el mismo
404 uniforme, antes de leer plantilla o preguntas. Tras comprobarla, tomar el
tenant de la invitación para crear la respuesta y añadir pruebas con un mismo
`patientProfileId` e invitaciones en dos tenants.

| Caso | Prueba propuesta | Resultado esperado |
| --- | --- | --- |
| Correcto | Paciente e invitación del tenant de la sesión | `200`/`201` y la respuesta conserva el tenant de la invitación. |
| Límite | Mismo paciente con invitaciones en dos organizaciones | La lista devuelve sólo las del tenant activo. |
| Error | Abrir UUID de invitación propia emitida por otro tenant | `404`, sin título, preguntas ni datos de atención. |
| Falla catalogada | Enviar respuesta con tenant distinto al de la invitación | `404/RESOURCE_NOT_FOUND/SURVEY_INVITATION_OUT_OF_SCOPE`; no se inserta respuesta. |

### SURV-02 — Alta — Idempotencia y unicidad dependen de comprobaciones en memoria, sin respaldo del DDL

El código consulta antes de insertar para no duplicar una asignación
([`surveys-assignments.service.ts`](../../../src/modules/surveys/services/surveys-assignments.service.ts#L112-L134)),
una invitación ([`…156-L236`](../../../src/modules/surveys/services/surveys-assignments.service.ts#L156-L236))
y las versiones se numeran a partir de la última leída
([`surveys-templates.service.ts`](../../../src/modules/surveys/services/surveys-templates.service.ts#L147-L191)).
Dos transacciones simultáneas pueden observar la ausencia o el mismo último número
antes de cualquiera de los `flush`.

El DDL sólo crea claves primarias, FKs e índices no únicos: no hay `UNIQUE` para
versión de plantilla, asignación, invitación, respuesta o respuesta por pregunta
([`02_tables.sql`](../../../database/SQL/65_surveys/02_tables.sql#L5-L118),
[`04_indexes.sql`](../../../database/SQL/65_surveys/04_indexes.sql#L5-L37)).
Tampoco hay `CHECK` que haga exclusiva una de las cuatro columnas `value_*`.
El patch reconoce expresamente que el índice único y ese `CHECK`, que el README
afirmaba, no se agregaron
([`2026-08-18_v4011_surveys_promocion_modulo_65.sql`](../../../database/SQL/patches/2026-08-18_v4011_surveys_promocion_modulo_65.sql#L22-L27)).

Así, un reintento concurrente puede emitir dos encuestas iguales para una misma
atención, crear dos versiones con el mismo número o dejar respuestas duplicadas.
La prueba actual verifica la repetición secuencial con mocks, pero no una carrera
ni una violación de restricción
([`surveys-assignments.service.spec.ts`](../../../src/modules/surveys/services/surveys-assignments.service.spec.ts#L274-L291)).

**Plan de corrección:** añadir en el modelo/migración las restricciones
`UNIQUE (survey_template_id, version_number)`, la unicidad de asignación activa,
`UNIQUE (appointment_booking_id, survey_version_id)`, `UNIQUE
(survey_invitation_id)` y `UNIQUE (survey_response_id, survey_question_id)`;
añadir el `CHECK` de exactamente una columna `value_*` no nula. Convertir la
violación esperable de invitación/asignación a conflicto idempotente y cubrir con
integración PostgreSQL dos llamadas concurrentes.

| Caso | Prueba propuesta | Resultado esperado |
| --- | --- | --- |
| Correcto | Emitir una vez para reserva completada y versión vigente | Una invitación y `201`. |
| Límite | Dos emisiones simultáneas para la misma reserva y versión | Una sola fila; una respuesta informa `alreadyIssued` o conflicto idempotente. |
| Error | Dos creaciones simultáneas de la versión siguiente | Sólo un número siguiente persistido; la segunda recibe conflicto. |
| Falla catalogada | Insertar dos respuestas a la misma pregunta de una misma cabecera | `409/CONFLICT/SURVEY_ANSWER_DUPLICATE`; sin segunda fila. |

## Controles verificados

Las rutas profesionales exigen `PRACTITIONER` o `CLINICIAN` y la plantilla se
carga comprobando tenant y profesional dueño
([`surveys-templates.controller.ts`](../../../src/modules/surveys/controllers/surveys-templates.controller.ts#L40-L43),
[`surveys-templates.service.ts`](../../../src/modules/surveys/services/surveys-templates.service.ts#L563-L593)).
La emisión comprueba que la reserva pertenezca al tenant y esté completada
([`surveys-assignments.service.ts`](../../../src/modules/surveys/services/surveys-assignments.service.ts#L160-L176)).
Las respuestas individuales no tienen ruta pública y la lectura profesional pasa
por la plantilla del dueño ([`surveys-templates.controller.ts`](../../../src/modules/surveys/controllers/surveys-templates.controller.ts#L185-L200),
[`surveys-responses.service.ts`](../../../src/modules/surveys/services/surveys-responses.service.ts#L191-L238)).

## Cobertura que debe mantenerse

Conservar las 65 pruebas actuales: propiedad de plantilla, publicación con
preguntas, cuestionario de otro paciente, obligatoriedad, tipo y escala de cada
respuesta, vencimiento, atención completada, vigencia y repetición secuencial.
Agregar integración con PostgreSQL y contexto de tenant para los cuatro casos de
cada hallazgo; los mocks actuales no pueden demostrar filtros SQL compuestos ni
restricciones concurrentes.
