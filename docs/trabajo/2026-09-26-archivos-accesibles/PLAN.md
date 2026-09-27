# Plan — Accesibilidad de archivos clínicos (texto alternativo, descripción y transcripción)

- Fecha: 2026-09-26 · Repo: `mantra-core-health-api` (rama `pablo/archivos-accesibles-2026-09-26` desde `origin/test` @ `6b44f0c0`).
- Resultado observable: un archivo (`common.files`) y un reporte diagnóstico (`clinical.diagnostic_reports`) pueden nacer con `altText`, `description` y `transcription`, y la respuesta los devuelve; un texto que excede el tope responde 400 y, si alguien salta la API, la base lo rechaza con un CHECK.
- Kill-test: `POST /common/files` con `altText` de 501 caracteres. Si pasa la validación, no está hecho. Sin base en el host, se ejercita con `class-validator` sobre el DTO real y con el servicio con `EntityManager` mockeado: techo honesto **`TESTED`**.

## Alcance
- IN: `database/SQL/patches/2026-09-26_v4233_*.sql` (nuevo), `database/SQL/02_common/02_tables.sql`, `database/SQL/08_clinical/02_tables.sql`, entidades `Files` y `DiagnosticReports`, `modules/common/dto/files.dto.ts`, `modules/common/repositories/files.repository.ts`, `modules/common/services/files.service.ts`, `modules/common/services/file-upload.service.ts`, `modules/clinical/dto/diagnostic-report.dto.ts`, `modules/clinical/repositories/diagnostic-reports.repository.ts`, `modules/clinical/services/diagnostic-reports.service.ts`, `src/common/dto/accessible-content.ts` (nuevo, topes compartidos) y specs.
- OUT: el `.puml` y el DDL generado del repo del modelo (ver Q-01); lecturas del módulo `diagnostics` (`/diagnostic-results/me`, informes versionados) y los adjuntos listados por otros módulos, que construyen su propia respuesta; edición posterior (no hay `PATCH` de archivos ni de reportes hoy); el front.
- Versión del parche: **v4233**. Tomadas en `origin/test` o PR abiertos: v4224 (API #490 y #495, duplicada), v4228–v4232 (API #488/#489/#491, modelo #36/#37). v4225–v4227 existen en `main` del modelo. v4233 es la primera libre en los dos repos.

## Ambigüedades registradas
- Q-01 · El modelo es la fuente del DDL (`.puml` → `SQL/`). Este parche nace en la API, como los cuatro parches propios que ya difieren del modelo (commit `6d123c52`). Supuesto: se abre acá y se refleja en el modelo después (`diagram_02_common.puml`, `diagram_08_clinical.puml`). Confirma: dueño del modelo (M1).
- Q-02 · Topes: `alt_text` ≤ 500, `description` ≤ 4 000, `transcription` ≤ 100 000 caracteres. WCAG no fija un número; 500 deja margen al texto alternativo breve (≈150 recomendado) sin permitir que se use como descripción larga, que tiene su propio campo. Confirma: producto.
- Q-03 · Ninguna de las dos tablas tenía `description`: no hay duplicado.

## H1 — Los tres textos tienen dónde vivir
**CA:** Dada una base viva, cuando se aplica v4233 dos veces, entonces existen 6 columnas y 6 CHECK sin error en la segunda pasada.
**DoD:** parche escrito con aserción interna; `02_tables.sql` coherente. Sin Postgres en el host: `WRITTEN`.
| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H1.S1.M1 | Parche v4233 idempotente (ADD COLUMN IF NOT EXISTS, DROP/ADD CHECK de `char_length`, aserción DO) | 6 columnas + 6 CHECK | lectura del parche + aserción | HECHO (WRITTEN: sin Postgres en el host) |
| H1.S1.M2 | `02_tables.sql` de 02_common y 08_clinical declaran las 3 columnas | rebuild desde cero las crea | `grep alt_text database/SQL/0*/02_tables.sql` | HECHO |

## H2 — La API las acepta, las valida y las devuelve
**CA:** Dado `CreateFileDto`/`UploadFileDto`/`CreateDiagnosticReportDto`, cuando llegan los tres campos dentro del tope, entonces se persisten y vuelven en la respuesta; en el tope exacto pasan; un carácter más o un tipo no texto → 400; ausentes → `undefined`.
**DoD:** `npx jest` de los specs dirigidos en verde; `tsc` y `eslint` limpios.
| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H2.S1.M1 | Topes compartidos + entidades `Files` y `DiagnosticReports` | compilan | `npx tsc --noEmit` | HECHO |
| H2.S1.M2 | DTOs de creación (`@IsOptional @IsString @MaxLength`) y respuesta | spec DTO: correcto / límite / inválido | `npx jest accessible` | HECHO |
| H2.S1.M3 | Repos y servicios persisten y mapean (incluida la subida multipart y la vía con publicación) | spec servicio: se persiste y se devuelve; ausente → undefined | `npx jest files.service diagnostic-reports.service file-upload.service` | HECHO |
