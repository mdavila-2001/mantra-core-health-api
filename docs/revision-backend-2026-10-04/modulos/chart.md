# Revisión del módulo `chart` — ALOVIDA

## Alcance y evidencia

Se revisaron notas versionadas, firmas, documentos, planes de cuidado, plantillas, lectura clínica, portal del paciente y PDF de encuentros. `corepack yarn test src/modules/chart --runInBand --silent` aprobó **18 suites y 139 pruebas**; emitió dos advertencias preexistentes sobre imports JSON.

## Hallazgos confirmados

### CHART-01 — Crítica — Las altas aceptan un encuentro que no pertenece al paciente del expediente

Las tres altas reciben `patientProfileId` y `encounterId` por separado. La guarda clínica autoriza el paciente del cuerpo, pero no resuelve el encuentro ([`clinical-record-access.guard.ts`](../../../src/modules/clinical/guards/clinical-record-access.guard.ts#L100-L145)). `createNote()` persiste ambos valores sin consultar el encuentro ([`chart-notes.service.ts`](../../../src/modules/chart/services/chart-notes.service.ts#L78-L113)); `createDocument()` y `createCarePlan()` únicamente llaman a `assertEncounterWritable()` y luego persisten los UUID recibidos ([`chart-documents.service.ts`](../../../src/modules/chart/services/chart-documents.service.ts#L69-L113), [`chart-care-plans.service.ts`](../../../src/modules/chart/services/chart-care-plans.service.ts#L115-L145)).

La guarda de sellado confirma expresamente que no valida existencia ni pertenencia paciente–encuentro y que cada servicio debe hacerlo antes ([`encounter-seal-guard.service.ts`](../../../src/modules/clinical/services/encounter-seal-guard.service.ts#L37-L59)). Ninguno de los tres lo hace. Un profesional con escritura sobre el paciente A puede enviar el UUID de un encuentro abierto del paciente B y crear una nota, documento o plan ligado a B pero atribuido a A. Esto contamina el expediente y los documentos oficiales por encuentro, y puede producir exposición o decisiones clínicas sobre datos mezclados.

**Plan:** exponer en `clinical` un validador transaccional `assertEncounterBelongsToPatientAndWritable(tx, encounterId, patientProfileId)` que devuelva ausente para combinación ajena o inexistente. Invocarlo antes de crear notas, documentos y planes cuando llegue `encounterId`; validar también condición y formulario de origen frente al mismo paciente cuando apliquen. Añadir una constraint compuesta o trigger sólo si el esquema permite garantizar el vínculo en BD.

| Caso | Prueba dirigida | Resultado esperado |
| --- | --- | --- |
| Correcto | Profesional autorizado crea nota, documento y plan para paciente A y encuentro abierto de A | `201`, todas las filas conservan la relación A–encuentro A |
| Límite | Alta sin `encounterId` | `201` sólo si el tipo de recurso permite episodio independiente |
| Error | Profesional autorizado sobre A usa encuentro abierto real de B | respuesta indistinguible de encuentro ausente; no hay filas ni archivos vinculados |
| Falla catalogada | Encuentro inexistente, ajeno o sellado | `404/RESOURCE_NOT_FOUND/CHART_ENCOUNTER_OUT_OF_SCOPE` o `422/PRECONDITION_FAILED/CHART_ENCOUNTER_SEALED`, sin escritura |

### CHART-02 — Media — Rechazos de autor/firma usan excepciones Nest sin razón estable

Las reglas de autor y firma llaman `ForbiddenException` directamente cuando falta perfil profesional o se declara uno ajeno ([`chart-care-plans.service.ts`](../../../src/modules/chart/services/chart-care-plans.service.ts#L75-L98), [`chart-notes.service.ts`](../../../src/modules/chart/services/chart-notes.service.ts#L607-L646)). El filtro global puede conservar `403`, pero esas excepciones no llevan `details.reason`; el cliente debe inferir la causa desde texto libre.

**Plan:** reemplazarlas por una excepción de dominio del módulo con reasons `CHART_PRACTITIONER_PROFILE_REQUIRED` y `CHART_SIGNER_PROFILE_MISMATCH`. Migrar tests HTTP para afirmar status, `ErrorCode` y reason, sin exponer el ID de perfil declarado.

| Caso | Prueba dirigida | Resultado esperado |
| --- | --- | --- |
| Correcto | Profesional firma su propia versión autorizada | `201` y firma atribuida al perfil de sesión |
| Límite | `SUPERADMIN` firma con perfil declarado válido | permitido bajo la política explícita |
| Error | Profesional declara otro `signerProfileId` | no se crea firma ni cambia versión |
| Falla catalogada | Sesión sin perfil profesional intenta crear plan o firmar | `403/FORBIDDEN/CHART_PRACTITIONER_PROFILE_REQUIRED` |

## Controles verificados y cobertura pendiente

La lectura de expediente usa `ClinicalRecordAccessGuard`; las mutaciones de notas existentes vuelven a autorizar contra el paciente cargado; el portal deriva el paciente de la sesión y oculta borradores/retenciones. Las pruebas actuales cubren sellado y transiciones con mocks, pero no la combinación cruzada paciente–encuentro ni la respuesta HTTP catalogada de los rechazos de autoría.
