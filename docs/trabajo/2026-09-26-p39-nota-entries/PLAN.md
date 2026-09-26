# Plan — P39 · filas clave/valor (`entries`) en la nota médica

- Fecha: 2026-09-26 · Repos afectados: `mantra-core-health-api` (rama `justin/nota-entries-p39-test-2026-09-26` desde `origin/test` @ `6b44f0c0`) · Predecesor: pendiente P39 del front (`test`)
- Resultado observable: el front manda `entries: [{ label, value }]` en `POST /charts/notes` y `PUT /charts/notes/:noteId/versions` y la API lo acepta (hoy 400 por `forbidNonWhitelisted`), lo guarda en la versión y lo devuelve como `entries` en `GET /charts/notes` y `GET /charts/patients/:id/chart`.
- Kill-test: validar con `class-validator` (`forbidNonWhitelisted`) un `CreateNoteDto` con `entries`. Si da `property entries should not exist`, no está hecho.
- Techo honesto: **`TESTED`** si Docker no está arriba (el daemon no responde al empezar); con Postgres local, la columna se verifica aplicando el patch dos veces.

## Alcance
- IN: `src/modules/chart/dto/notes.dto.ts`, `src/modules/chart/dto/chart-read.dto.ts`, `src/modules/chart/entities/clinical_note_versions.entity.ts`, `src/modules/chart/repositories/clinical-notes.repository.ts`, `src/modules/chart/services/chart-notes.service.ts`, `src/modules/chart/services/chart-note-item.mapper.ts` y specs del módulo chart; `database/SQL/15_chart/02_tables.sql` + `database/SQL/patches/2026-09-26_v4224_clinical_note_entries.sql`; artefactos generados que CI exige al día (openapi, docs/data, docs/modules, postman) sólo si cambian por esto; este directorio.
- OUT: `AmendNoteDto`/enmiendas (no lo pide el front), entidades de pedidos/planes/citas (`formInstanceId`, otro agente), `mantra-core-health-api` y `wt-api-test`, el repo del modelo.
- Ambigüedades registradas:
  - A1 · El encargo dice `database/SQL/99_migrations/`; esa carpeta no existe: los parches viven en `database/SQL/patches/AAAA-MM-DD_vNNNN_*.sql`. Se sigue la convención real (v4224). Confirmar con quien mantiene el modelo.
  - A2 · Fila vacía: se exige `label` y `value` no vacíos tras recortar (una fila vacía no aporta nada). Confirmar con el front.
  - A3 · Respuesta: `entries` siempre presente, `[]` cuando la versión no tiene filas o no se resolvió (el front lee `nota.entries` sin guardas).
  - A4 · Hash de firma: las filas entran al `content_hash` sólo cuando hay alguna, para que las versiones ya firmadas sin filas conserven el mismo hash.

## H1 — `entries` viaja de punta a punta
**CA:** Dado un cuerpo del front con `entries`, cuando se crea la nota o se agrega versión, entonces pasa la validación, se guarda en `entries_json` de la versión y se lee como `entries` en el listado y en el expediente.
**DoD:** jest dirigido en verde + typecheck/lint exit 0.
**Estado:** A MEDIAS

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H1.M1 | `NoteEntryInputDto` + `entries?` en `CreateNoteDto` y `AddVersionDto` | válido pasa; label vacío, value vacío, >120/>2000, >50 filas, propiedad extra → error | `jest src/modules/chart/dto/notes-entries.dto.spec.ts` → PASS | HECHO |
| H1.M2 | Columna `entries_json jsonb` en entidad + DDL + patch idempotente | entidad declara `entriesJson`; patch usa `ADD COLUMN IF NOT EXISTS` | `grep entries_json` en los tres; psql dos veces si hay Postgres | A MEDIAS |
| H1.M3 | El servicio persiste `entries` en create y addVersion, y el hash las incluye si hay | spec: `createVersion` recibe `entries`; hash sin filas no cambia | `jest chart-notes.service.spec.ts` → PASS | HECHO |
| H1.M4 | Mapper devuelve `entries` (`[]` por omisión) en expediente y listado | spec del mapper/lecturas | `jest chart-read.service.spec.ts chart-notes-read.service.spec.ts` → PASS | HECHO |
| H1.M5 | Artefactos generados al día | `git diff` sólo muestra `entries` | generador de openapi y docs | DESCARTADO |

## Riesgos y bloqueos previstos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| Docker apagado | sin prueba contra base | se declara `TESTED`, no `VERIFIED` |
| Otro agente usa v4224 | colisión de número de parche | nombres de archivo distintos; se avisa en el PR |
