# src / modules / insurance

Agrupa los componentes relacionados con **insurance** y mantiene cohesionada esta responsabilidad del sistema.

## Administración de planes y coberturas

Las lecturas `GET /insurance-carriers` y `GET /insurance-carriers/:carrierId`
están acotadas al carrier del tenant activo. Ambas calculan `canAdminister` en
el servidor; cada beneficio devuelve `approvalRules` normalizadas con
`requiredDocuments: []` y `exclusionNotes: null` cuando no hay reglas válidas.

Las siguientes mutaciones exigen un tenant activo y una membresía `OWNER` o
`ADMIN`. Los roles de plataforma `SECURITY_ADMIN` y `SUPERADMIN` conservan el
acceso excepcional, pero `OWNER`/`ADMIN` nunca se interpretan como roles del
JWT:

| Método y ruta | Cuerpo administrado | Respuesta |
| --- | --- | --- |
| `POST /insurance-products/:productId/plans` | Código, nombre, vigencia, moneda opcional y prima de lista mensual opcional | `{ id }` |
| `POST /insurance-plans/:planId/benefits` | Categoría, servicio opcional, vigencia e importes | `{ id }` |
| `PUT /insurance-plans/:planId/benefits/:benefitId` | Porcentaje, copago, deducible y tope anual; `null` borra | `{ ok: true }` |
| `PUT /insurance-plans/:planId/benefits/:benefitId/rules` | Autorización previa, documentos y exclusión | `{ ok: true }` |
| `PUT /insurance-plans/:planId/premium` | Prima de lista mensual del plan; `null` la quita | `{ id, monthlyPremiumAmount }` |

Todos los identificadores se resuelven por la cadena
tenant → carrier → producto → plan → beneficio. Un recurso inexistente, ajeno
o una combinación plan/beneficio inválida responde `404`; un miembro activo
sin capacidad administrativa responde `403`. Las escrituras actualizan la
auditoría dentro de la misma transacción.

Los documentos admitidos son `FIRMA_MEDICO`, `SELLO_MEDICO`, `ORDEN_MEDICA` e
`INFORME_CLINICO`. Las reglas se guardan con las claves canónicas
`requiredDocuments` y `exclusionNotes`, preservando claves desconocidas del
JSON de elegibilidad.

## Portabilidad del titular

Portabilidad de póliza e historial de siniestralidad a 1 clic (subtarea 3.3):
el titular exporta su propio historial de coberturas, atenciones, siniestros
y diagnósticos como un certificado sellado con SHA-256, verificable
públicamente por cualquier tercero (una nueva aseguradora, un auditor) sin
sesión ni exposición de datos clínicos.

| Método y ruta | Quién puede | Respuesta |
| --- | --- | --- |
| `POST /insurance/portability/export` | El titular del `patientProfileId` del cuerpo, o plataforma | `201` con `PortabilityExportResultDto` (`certificateId`, `manifestHash`, URLs de descarga y verificación, resumen actuarial) |
| `GET /insurance/portability/certificates/:certificateId/pdf` | El titular del certificado, o plataforma | `200` PDF con QR y sello |
| `GET /insurance/portability/certificates/:certificateId/json` | El titular del certificado, o plataforma | `200` JSON, exactamente como se selló |
| `GET /public/portability/verify/:manifestHash` | Sin sesión (`@Public`) | `200` `PortabilityVerificationResponseDto` sin PHI, o `404` |

**Autorización**: sin `@Roles` — `InsurancePortabilityService` resuelve la
titularidad con `ProfileOwnershipService.assertOwnsPatientProfile` (el actor
del JWT o un rol de plataforma). Un rechazo por perfil ajeno responde `403`
y deja un asiento `INSURANCE_PORTABILITY_DENIED` en `audit.audit_log`
(AC-03-03-D); un intento de descargar el certificado de otro responde `403`
antes de leer el archivo.

**Persistencia**: el certificado NO tiene tabla propia — reusa
`health_data.health_export_jobs`/`health_export_manifests` (el
`content_hash` del manifiesto ES el sello impreso), más `common.files`
(PHI), `audit.dsar_requests` (`DSAR_TYPE_PORTABILITY`) y
`audit.data_access_log`, todo en una transacción. El `generatedAt` que
devuelve el `verify` público es el mismo instante sellado en el JSON y el
PDF (`health_export_jobs.requested_at` se fija explícitamente, no un
`new Date()` posterior).

**Contenido del certificado** (`schemaVersion: 'alovida.insurance-portability/2'`):
pólizas/coberturas, atenciones (`clinical.encounters`, sin motivo de
consulta — minimización de PHI ante un tercero), reclamos con su dictamen
vigente, diagnósticos codificados y un resumen actuarial (totales,
siniestralidad estimada contra la prima de lista del plan). El QR y
`verificationUrl` apuntan a `${WEB_APP_BASE_URL}/verify/portability/:hash`
del frontend (`scheduling/notices/agenda-notices.env.ts`); el hash público
se acepta en mayúsculas o minúsculas y se normaliza antes de consultar.

## Contenido

### Subcarpetas

- [`controllers/`](./controllers/README.md): Adaptadores HTTP que validan solicitudes, aplican autorización y delegan la lógica en servicios.
- [`dto/`](./dto/README.md): Contratos de entrada y salida, validación y documentación de la API.
- [`entities/`](./entities/README.md): Entidades y relaciones que representan el modelo persistente.
- [`repositories/`](./repositories/README.md): Consultas y operaciones de persistencia aisladas de la lógica de negocio.
- [`services/`](./services/README.md): Casos de uso, reglas de negocio y coordinación transaccional.

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `insurance.concepts.ts` | Implementación o recurso de soporte de esta carpeta. |
| `insurance.module.ts` | Composición de dependencias del módulo NestJS. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
