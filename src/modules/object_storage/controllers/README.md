# Controladores de almacenamiento de objetos

Capa HTTP: recibe, delega y devuelve. Sin lógica de negocio.

## Controladores

Dos, porque publican bajo prefijos distintos:

- **`ObjectStorageController`** (`/object-storage`) — los once casos de uso internos del módulo.
- **`DicomWebController`** (`/dicomweb`) — la superficie que espera un visor DICOM estándar. Va
  aparte porque su forma es la del protocolo; meterla bajo `/object-storage` la volvería inservible
  para ese cliente.

## Rutas

| Método | Ruta | UC |
| --- | --- | --- |
| `POST` | `/object-storage/namespaces/:code/uploads/initiate` | 01 |
| `POST` | `/object-storage/uploads/:id/complete` | 02 |
| `POST` | `/object-storage/objects/:manifestId/versions` | 03 |
| `POST` | `/object-storage/dicom/studies/catalog` | 04 |
| `POST` | `/object-storage/large-payloads` | 06 |
| `POST` | `/object-storage/versions/:versionId/retention-lock` | 07 |
| `POST` | `/object-storage/versions/:versionId/legal-holds` | 08 |
| `DELETE` | `/object-storage/versions/:versionId/legal-holds/:holdId` | 08 |
| `POST` | `/object-storage/versions/:versionId/signed-url` | 09 |
| `POST` | `/object-storage/versions/:versionId/integrity-checks` | 10 |
| `POST` | `/object-storage/archive-jobs/build` | 11 |
| `POST` | `/object-storage/objects/:manifestId/request-deletion` | 12 |
| `GET` | `/dicomweb/studies/:studyUid/series/:seriesUid/instances/:sopUid` | 05 |

## Decisiones de ruteo

- **Segmentos planos en lugar de `:` de acción.** Los casos de uso escriben `uploads:initiate`,
  `{id}:complete`, `studies:catalog`, `archive-jobs:build` y `{manifestId}:request-deletion`; Nest 11
  usa path-to-regexp v8, que trata `:` como inicio de parámetro en **cualquier** punto del segmento.
  Misma convención que el resto del proyecto.
- **`DELETE` en la liberación de la retención legal (08)**: el caso de uso lo declara así, y encaja —
  se retira un recurso concreto, identificado por su id.
- **`versions/:versionId/...` cuelga de la versión, no del objeto**: la retención, la integridad y el
  acceso firmado operan sobre un contenido concreto. Anidarlos bajo el objeto obligaría a repetir un
  dato que el servidor ya conoce.
- **`:code` no lleva `ParseUUIDPipe`**: es el código legible del espacio de nombres.
- **Los UID DICOM tampoco**: son identificadores del estándar (`1.2.840.10008...`), no UUID.

## Códigos de estado

`201 Created` en lo que crea recurso o registra un evento nuevo (01–04, 06–12). `200 OK` en la
liberación de la retención legal y en la lectura DICOMweb.

El acceso DICOMweb denegado devuelve **`200` con `outcome: 'denied'`**, no un `403`. La denegación es
la respuesta del control de acceso y viene acompañada de su registro; un error HTTP haría perder el
`accessLogId` que permite correlacionar el intento.

## Permisos

`STORAGE_ADMIN` en todo. Además: `STORAGE_CLIENT` (01, 02), `SYSTEM` (01–03, 06, 09–11),
`PACS_GATEWAY` (04), `COMPLIANCE_OFFICER` (07, 12), `LEGAL_COUNSEL` (08), y `DICOM_VIEWER` /
`CLINICIAN` (05, 09).

Ninguna ruta es `@Public()`.

## Pruebas

- `object-storage.controller.spec.ts` (12): una por endpoint, comprobando que delega en el servicio
  correcto y que pasa los ids de ruta, el cuerpo y el actor.
- `dicomweb.controller.spec.ts` (2): los tres UID y el propósito de uso, presente y ausente.
