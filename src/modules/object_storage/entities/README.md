# src / modules / object storage / entities

Entidades y relaciones que representan el modelo persistente.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `archive_manifests.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `dicom_instance_manifests.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `dicom_series_manifests.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `dicom_study_manifests.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `dicomweb_access_logs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Public export barrel for this folder. |
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

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
