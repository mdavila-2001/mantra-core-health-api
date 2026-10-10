<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/chart/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver docs/progress/ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `chart`

**Fuente:** [`src/modules/chart/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/chart/README.md)
· 7 controllers · 8 services · 4 repositories · 11 entidades · 6 DTO

---

# src / modules / chart

Agrupa los componentes relacionados con **chart** y mantiene cohesionada esta responsabilidad del sistema.

## Rutas HTTP y alcance (medido)

<!-- Medido el 2026-10-08 sobre origin/dev (dae4fd68). Repetir con:
  find src/modules/chart -name '*.controller.ts' | wc -l
  find src/modules/chart -name '*.controller.ts' -exec grep -hE "^\s*@(Get|Post|Put|Patch|Delete)\(" {} + | wc -l
  find src/modules/chart -name '*.entity.ts' | wc -l
  find src/modules/chart -name '*.service.ts' | wc -l
La tabla sale de los decoradores `@Controller`/`@Get`/`@Post`/`@Put`/`@Patch`/`@Delete`, `@Roles` y `@Public`. -->

El módulo tiene **7 controllers, 23 rutas HTTP, 11 entidad y 8 servicios**. La columna *Acceso* sale del código: `pública` = `@Public()`; un rol = `@Roles(...)`; `sesión` = sin ninguno de los dos, o sea que sólo exige sesión autenticada (guards globales `JwtAuthGuard`, `TenantScopeGuard`, `RolesGuard`, `VerifiedIdentityGuard`). La autorización por recurso puede vivir además en el servicio y no se refleja acá.

Si una tabla narrativa más abajo difiere de ésta (prefijo del controller omitido, sufijos `:accion` de la spec en lugar de sub-rutas), manda ésta: sale del código.

Importa (`ClinicalModule`, `CommonModule`, `TerminologyModule`).

Entidades (`tableName`, 11 de 11 archivos `*.entity.ts`): `care_plan_activities`, `care_plans`, `chart_template_assignments`, `clinical_note_headers`, `clinical_note_signatures`, `clinical_note_versions`, `document_record_files`, `document_records`, `note_release_events`, `physical_exam_findings`, `specialty_chart_templates`.

| Método y ruta | Acceso | Controller |
| --- | --- | --- |
| `POST /charts/care-plans` | CLINICIAN, PRACTITIONER | `chart-care-plans` |
| `PATCH /charts/care-plans/:planId/activities/:activityId` | CLINICIAN, PRACTITIONER | `chart-care-plans` |
| `POST /charts/documents` | CLINICIAN, PRACTITIONER | `chart-documents` |
| `GET /charts/documents/:documentId/files/:fileId/content` | CLINICIAN, PRACTITIONER | `chart-documents` |
| `GET /charts/encounters/:id/pdf` | CLINICIAN, PRACTITIONER | `chart-encounters` |
| `GET /charts/me/notes` | sesión | `chart-me` |
| `GET /charts/me/documents` | sesión | `chart-me` |
| `GET /charts/me/documents/:documentId/files/:fileId/content` | sesión | `chart-me` |
| `GET /charts/me/encounters/:id/pdf` | sesión | `chart-me` |
| `GET /charts/notes` | CLINICIAN, PRACTITIONER | `chart-notes` |
| `POST /charts/notes` | CLINICIAN, PRACTITIONER | `chart-notes` |
| `PUT /charts/notes/:noteId/versions` | CLINICIAN, PRACTITIONER | `chart-notes` |
| `POST /charts/notes/:noteId/versions/:versionId/sign` | CLINICIAN, PRACTITIONER | `chart-notes` |
| `POST /charts/notes/:noteId/versions/:versionId/cosign` | CLINICIAN, PRACTITIONER | `chart-notes` |
| `POST /charts/notes/:noteId/amendments` | CLINICIAN, PRACTITIONER | `chart-notes` |
| `POST /charts/notes/versions/:versionId/release` | CLINICIAN, PRACTITIONER | `chart-notes` |
| `POST /charts/notes/versions/:versionId/withhold` | CLINICIAN, PRACTITIONER | `chart-notes` |
| `POST /charts/notes/versions/:versionId/exam-findings` | CLINICIAN, PRACTITIONER | `chart-notes` |
| `GET /charts/patients/:patientProfileId/chart` | CLINICIAN, PRACTITIONER | `chart-read` |
| `POST /charts/templates/:templateId/assignments` | SECURITY_ADMIN | `chart-templates` |
| `POST /charts/templates` | SECURITY_ADMIN | `chart-templates` |
| `GET /charts/templates` | CLINICIAN, PRACTITIONER, SECURITY_ADMIN | `chart-templates` |
| `GET /charts/templates/:id` | CLINICIAN, PRACTITIONER, SECURITY_ADMIN | `chart-templates` |

## Contenido

### Subcarpetas

- [`controllers/`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/chart/controllers/README.md): Adaptadores HTTP que validan solicitudes, aplican autorización y delegan la lógica en servicios.
- [`dto/`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/chart/dto/README.md): Contratos de entrada y salida, validación y documentación de la API.
- [`entities/`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/chart/entities/README.md): Entidades y relaciones que representan el modelo persistente.
- [`repositories/`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/chart/repositories/README.md): Consultas y operaciones de persistencia aisladas de la lógica de negocio.
- [`services/`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/chart/services/README.md): Casos de uso, reglas de negocio y coordinación transaccional.

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `chart.concepts.ts` | Implementación o recurso de soporte de esta carpeta. |
| `chart.module.ts` | Composición de dependencias del módulo NestJS. |

## Documentos del expediente y firma

- **Vínculo gobernado (`POST /charts/documents`).** Cada `files[].fileId` pasa,
  dentro de la misma transacción, por `AttachableFileService.assertUsableBy`
  (`AttachableFileService`, de `common`): 404 si el archivo no existe, 403 si
  lo subió otro usuario, 422 si está borrado, sin versión vigente, infectado o
  de un tipo no admitido para un documento (`UPLOAD_MIME_ALLOWLIST.DOCUMENT`).
  Si un archivo no pasa la comprobación, el documento no se crea. El
  `tenantId` ajeno ya lo rechaza el interceptor global de contexto de tenant
  antes de llegar al controlador; el servicio no lo repite.
- **Lectura (`GET /charts/patients/:id/chart`).** Cada documento trae
  `files[]` — `fileId`, `contentRole` (`PRIMARY`/`ATTACHMENT`) y `ordinal` —,
  ordenados por `ordinal`, resueltos en una sola consulta por lote para todos
  los documentos de la página.
- **Descarga (`GET /charts/documents/:documentId/files/:fileId/content`).**
  Sirve los bytes con `Cache-Control: private, no-store` a quien puede leer
  la historia del paciente dueño del documento —el mismo criterio que abre el
  expediente, no sólo quien subió el archivo—. Devuelve el mismo 404 tanto si
  el documento no existe como si el archivo no cuelga de él, sin distinguir
  cuál de las dos cosas falló.
- **Firma propia (`sign`/`cosign` de una versión de nota).** El
  `signerProfileId` es opcional: si falta, el firmante es el perfil profesional de la sesión; si viene, tiene que ser el perfil profesional de quien
  firma (`practitionerProfileId` de la sesión); si no coincide, 403. Sin
  perfil profesional en la sesión, también 403. Un rol `SUPERADMIN` tiene
  paso franco, igual que en el resto de barreras por rol del sistema.

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.

