# src / modules / object storage / entities

Entidades y relaciones que representan el modelo persistente.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `archive_manifests.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `dicom_instance_manifests.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `dicom_series_manifests.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `dicom_study_manifests.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `dicomweb_access_logs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `large_payload_manifests.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `multipart_uploads.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `object_checksums.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `object_deletion_markers.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `object_encryption_envelopes.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `object_integrity_checks.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `object_legal_holds.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `object_locations.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `object_manifests.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `object_namespaces.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `object_retention_locks.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `object_versions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
