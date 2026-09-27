# Reporte — Accesibilidad de archivos clínicos (v4.2.33)

- Rama: `pablo/archivos-accesibles-2026-09-26` desde `origin/test` @ `6b44f0c0`.
- Peldaño alcanzado: **`TESTED`** (unitarias dirigidas + contrato DDL↔API). No `VERIFIED`: no hay Postgres en el host para aplicar el parche ni hacer el round-trip HTTP.

## Qué cambió
- `database/SQL/patches/2026-09-26_v4233_files_diagnostic_reports_accessibility.sql`: `alt_text` (varchar), `description` y `transcription` (text) en `common.files` y `clinical.diagnostic_reports`, con 6 CHECK de `char_length` (500 / 4 000 / 100 000) y aserción interna. Idempotente, sin backfill.
- `02_common/02_tables.sql` y `08_clinical/02_tables.sql` declaran las columnas (rebuild desde cero).
- `src/common/dto/accessible-content.dto.ts`: topes compartidos, `AccessibleContentInputDto` (`@IsOptional @IsString @MaxLength`), `AccessibleContentResponseDto` y `pickAccessibleContent` (omite `null`).
- `CreateFileDto`, `UploadFileDto` (multipart) y `CreateDiagnosticReportDto` heredan los tres campos; `FileResponseDto` y `DiagnosticReportResponseDto` los devuelven.
- Entidades `Files` y `DiagnosticReports`; repos y servicios los persisten. La subida multipart los lleva por las dos vías (adaptador directo y `StoragePublicationService`) y la pre-carga anónima.
- Lectura: `FilesService.fileToResponse` es el único mapeo de `FileResponseDto`, así que el alta, la subida y el listado de adjuntos (`listLinkedFiles`) los devuelven.

## Verificación
| Comando | Veredicto | Salida |
|---|---|---|
| `npx tsc --noEmit -p tsconfig.json` | PASS | `TSC_EXIT=0` (evidencia/tsc-eslint.txt) |
| `npx eslint <16 .ts tocados>` | PASS | `ESLINT_EXIT=0` tras aplicar prettier a 2 archivos |
| `jest` (5 suites: DTO, contrato DDL, files, file-upload, diagnostic-reports) | PASS | `Test Suites: 5 passed, 5 total · Tests: 94 passed, 94 total` (evidencia/jest.txt) |

Niveles cubiertos en la DTO (las tres clases de alta): correcto (ausentes; dentro del tope), límite (largo exacto del tope; cadena vacía), inválido (tope + 1; tipo no cadena → 400 en las tres propiedades).

## No cubierto
- Aplicar v4.2.33 contra Postgres (dos pasadas, CHECK que rechaza 501 caracteres) y el round-trip `POST /common/files` → respuesta: sin base en el host.
- Modelo canónico (`mantra-core-health-model`): el parche nace en la API. Falta reflejarlo en `diagram_02_common.puml` y `diagram_08_clinical.puml` + `gen_ddl.py` para que un `yarn db:vendor` futuro no lo pierda (Q-01, pedido a M1).
- `openapi/` no se regeneró (`docs:openapi:generate` exige `yarn build`, prohibido en esta máquina compartida).
- Edición posterior de los textos: no hay `PATCH` de archivos ni de reportes hoy; tampoco se tocaron las lecturas del módulo `diagnostics` (`/diagnostic-results/me`, informes versionados) ni `audit.diagnostic_reports_history` (guarda `data_snapshot` jsonb, sin cambio de esquema).
- Numeración: v4224 está duplicada en dos PR abiertos ajenos (#490, #495); no es de este alcance, se anota.
