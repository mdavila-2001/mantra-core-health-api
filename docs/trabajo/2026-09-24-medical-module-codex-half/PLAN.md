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

## Riesgos y bloqueos previstos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| El workflow consume una imagen histórica de MinIO retirada. | El check `docs` seguirá bloqueado aunque el cambio médico sea correcto. | Mantener el diagnóstico separado y abrir una corrección de infraestructura con fuente oficial, sin contaminar este diff. |
| El resumen propio y la ficha pública comparten DTO. | Podría filtrarse el NIT en la guía. | Leer y asignar NIT únicamente cuando `incluyeContacto` sea verdadero. |
| Cambiar un solo campo puede borrar el otro. | Corrupción de identidad fiscal. | Reutilizar la semántica histórica ya probada en Paciente y cubrir cambios parciales. |
