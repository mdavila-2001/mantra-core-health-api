# Revisión del módulo `object_storage` — ALOVIDA

## Alcance y evidencia

Se revisaron cargas, versiones, gobierno, DICOMweb, acceso firmado y sus repositorios. `corepack yarn test src/modules/object_storage --runInBand --silent` aprobó **5 suites y 110 pruebas**; produjo dos advertencias preexistentes de imports JSON sin atributo. Las rutas de URL firmada sí aplican tenant, finalidad permitida y `ClinicalReadService` antes de entregar bytes ([`object-storage.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/object_storage/services/object-storage.service.ts#L863-L1029)).

## Hallazgo confirmado

### OBJ-01 — Crítica — DICOMweb permite leer referencias clínicas sin política de tenant ni paciente

`GET /dicomweb/studies/:studyUid/series/:seriesUid/instances/:sopUid` autoriza por los roles globales `DICOM_VIEWER`, `CLINICIAN` o `STORAGE_ADMIN` ([`dicomweb.controller.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/object_storage/controllers/dicomweb.controller.ts#L39-L68)). En `resolveInstance`, tras comprobar sólo que `purposeOfUseCode` exista, el servicio busca el estudio exclusivamente por UID (`findStudyByUid(tx, studyInstanceUid)`) y resuelve serie, instancia y manifiesto; si el objeto está disponible registra `ALLOWED` y devuelve `objectManifestId` y `currentVersionId` ([`dicom-catalog.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/object_storage/services/dicom-catalog.service.ts#L190-L285)). No compara `study.tenantId` con `actor.tenantIds`, no llama a `ClinicalReadService` ni comprueba consentimiento o relación asistencial.

El propósito de uso es texto declarado por el consumidor, no autorización. Un clínico de un tenant que conozca o enumere un UID DICOM ajeno puede obtener la referencia de la instancia clínica. Además, el catálogo acepta `dto.tenantId` y `dto.patientProfileId` desde el gateway sin verificar que el actor pueda escribir para ambos ([`dicom-catalog.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/object_storage/services/dicom-catalog.service.ts#L48-L155)).

**Plan:** extraer una única comprobación de acceso clínico y usarla tanto en DICOMweb como en URL firmada. DICOMweb debe resolver el estudio dentro del tenant del actor, validar la finalidad contra el catálogo y ejecutar `ClinicalReadService.assertPuedeLeerHistoria(study.patientProfileId, actor)` antes de devolver IDs. El catálogo debe derivar o validar tenant y paciente frente a la identidad del gateway. Conservar registro de denegación, pero no revelar si UID, serie o instancia existen fuera de alcance.

| Caso | Prueba dirigida | Resultado esperado |
| --- | --- | --- |
| Correcto | Clínico del tenant con acceso clínico y finalidad permitida consulta instancia | `200`, `ALLOWED` y log con coordenadas reales |
| Límite | Viewer del mismo tenant sin relación clínica activa | denegación uniforme y log `DENIED` |
| Error | Actor de otro tenant consulta un UID real | respuesta indistinguible de ausente, sin `objectManifestId` ni versión |
| Falla catalogada | Finalidad omitida o no permitida | `404/RESOURCE_NOT_FOUND/OBJECT_VERSION_NOT_FOUND` y razón `DICOM_ACCESS_DENIED`, con log `DENIED` |

## Cobertura pendiente

Las pruebas actuales cubren catálogo, transiciones y emisión de acceso firmado, pero deben incorporar dos tenants y autorización clínica para DICOMweb y para el catálogo PACS. También se debe verificar que las respuestas y logs no filtren UID de estudios ajenos.
