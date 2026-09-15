<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/chart/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `chart`

**Fuente:** [`src/modules/chart/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/chart/README.md)
· 5 controllers · 6 services · 4 repositories · 11 entidades · 5 DTO

---

# src / modules / chart

Agrupa los componentes relacionados con **chart** y mantiene cohesionada esta responsabilidad del sistema.

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
  `signerProfileId` del cuerpo tiene que ser el perfil profesional de quien
  firma (`practitionerProfileId` de la sesión); si no coincide, 403. Sin
  perfil profesional en la sesión, también 403. Un rol `SUPERADMIN` tiene
  paso franco, igual que en el resto de barreras por rol del sistema.

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.

