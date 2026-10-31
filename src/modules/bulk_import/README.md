# bulk_import — motor de cargas masivas

Altas masivas de usuarios y carga especial de historias clínicas, con **plantilla CSV y JSON
generada del mismo esquema que valida** (regla T1 del plan
`docs/trabajo/2026-10-30-perfil-admin-medicion-gobierno/PLAN.md`, H6 y H7).

> **Estado honesto.** El motor (esquema, plantillas, validación, vista previa, confirmación
> idempotente, procesamiento asíncrono con plazos, informe, autorización, auditoría) está completo y
> probado **contra dobles declarados**. Lo que sale a producción hoy: ninguna persistencia durable, ningún
> alta real de usuarios y ninguna escritura clínica real. Ver «Colaboradores» y «Bloqueado».
> `GET /admin/bulk-imports/templates` devuelve ese estado en `engine`.

## Rutas (prefijo `admin/bulk-imports`)

Todas exigen rol `SECURITY_ADMIN` o `PLATFORM_ADMIN` (`SUPERADMIN` pasa) y la organización activa
(`X-Tenant-Id`, o la única membresía). Los lotes se aíslan por organización: uno ajeno responde **404**.
Los que operan sobre un lote o crean uno exigen además el **permiso fino** del tipo de carga.

| Método y ruta | Qué hace | Éxito |
|---|---|---|
| `GET /templates` | Catálogo de los 10 tipos, topes y estado declarado del motor | 200 |
| `GET /templates/:kind?format=csv\|json` | Descarga la plantilla (por defecto `csv`) con nombre y tipo | 200 archivo |
| `GET /?limit=` | Lotes de la organización de los grupos que el actor puede ver | 200 |
| `POST /` | Crea un lote y devuelve la vista previa (`VALIDADO` o `RECHAZADO`) | 201 |
| `POST /:id/confirm` | Confirma (cabecera `Idempotency-Key` obligatoria) y encola | 202 |
| `GET /:id` | Estado, vista previa y avance | 200 |
| `GET /:id/report?format=json\|csv` | Informe: creadas, omitidas, conflictos, rechazadas, con motivo | 200 |

`POST /` acepta `multipart/form-data` (`file` CSV/JSON hasta 20 MB + campos de texto) o
`application/json` (`rows`). El cuerpo JSON lo limita antes el tope global de `main.ts` (1 MB); para
lotes grandes se sube archivo. Más de 20 MB o de 5.000 filas → **413** sin crear lote.

Declaración del lote: usuarios → `reason`; historia clínica → `sourceOrganization`, `legalBasis`,
`loadedAt` (`AAAA-MM-DD`, no futura). Lo que no corresponde al tipo se rechaza.

## Tipos de carga (`kind`)

`usuario-paciente`, `usuario-profesional`, `usuario-personal-organizacion`, `hc-encuentro`,
`hc-diagnostico`, `hc-medicacion`, `hc-alergia`, `hc-signo-vital`, `hc-resultado`, `hc-nota`.

Cada columna cita en `source` el DTO/entidad existente de donde sale (`schema/*.ts`); una prueba
verifica que el archivo citado existe. Decisiones del esquema:

- **Usuarios sin contraseña y sin roles privilegiados**: la cuenta nace pendiente (camino de alta
  asistida C-18) y el titular activa la suya; `OWNER`, `SECURITY_ADMIN` y `clinicalRoles` no se conceden
  por archivo.
- **Historia clínica**: todas las filas abren con `nationalId` + `birthDate` (el «paciente-ref» del plan
  es ese bloque común, no un tipo propio) y `sourceRecordId` (clave de deduplicación y procedencia).
  **Ningún código clínico está escrito**: se envían como `<campo>System` + `<campo>Code` y se resuelven
  contra la terminología existente. La plantilla usa `sistema-demo` / `SINT-…`, sintéticos.

## Validación en dos capas

1. **Estructural** (sólo esquema): lista blanca de columnas, obligatorias, tipo/formato, reglas entre
   campos, unicidad dentro del archivo. Es la que garantiza que *la fila de la plantilla siempre pasa*.
2. **Referencial** (historia clínica): paciente por documento + fecha de nacimiento (0 o >1 →
   rechazada), consentimiento revocado, códigos contra terminología. Se **repite al procesar**; no se
   hereda de la vista previa.

Los mensajes dicen qué se espera y nunca repiten el valor recibido. Un encabezado desconocido se nombra
por posición, no por contenido (un CSV sin encabezado pondría datos de una persona como «columna»).

## Estados del lote

`VALIDADO → EN_COLA → PROCESANDO → COMPLETADO | FALLIDO`; `RECHAZADO` es terminal.
Cada transición es `transition(id, from[], to)` con la precondición en la escritura. Un lote con
al menos una fila válida queda `VALIDADO` aunque tenga rechazadas (se informan, no se procesan).

Procesamiento: en proceso, por `setImmediate`; plazo de fila 10 s, de lote 10 min, un reintento sólo ante
errores transitorios. Una fila que falla no aborta el resto. Si se agota el plazo del lote, las filas
restantes quedan `NO_PROCESADA` y el lote `FALLIDO` (`BATCH_TIMEOUT`). Al cerrar, el informe se escribe y
las filas (datos personales) se vacían en la misma transición.

## Autorización

- Rol de gestión: `@Roles('SECURITY_ADMIN', 'PLATFORM_ADMIN')` (guard global).
- Permiso fino, **sin tablas nuevas**: filas de `authz.permissions` con `resource` `bulk_import.users` /
  `bulk_import.clinical` y acción `EXECUTE`, resueltas por `AuthzPdpService.evaluate`
  (`adapters/pdp-access-policy.adapter.ts`). Sin la fila, el PDP deniega (deny por defecto): hay que
  **crearla por `POST /authz/permissions` y concederla** (por rol o `user_permission_grants`); no se
  siembra desde este módulo.
- Objeto-nivel: primero organización (otra → 404), después permiso (403).

## Colaboradores (puertos en `ports/bulk-import.ports.ts`)

| Puerto | Adaptador cableado hoy | Estado |
|---|---|---|
| `BulkImportBatchRepository` | `InMemoryBatchRepository` | **Doble declarado, no durable** |
| `UserProvisionerPort` | `NotConnectedUserProvisioner` | No conectado: filas `RECHAZADA / EXECUTOR_NOT_CONNECTED` |
| `ClinicalRecordWriterPort` | `NotConnectedClinicalWriter` | No conectado: ídem |
| `PatientResolverPort` | `NotConnectedPatientResolver` | No conectado: filas `RECHAZADA / RESOLUTION_UNAVAILABLE` |
| `CodeResolverPort` | `NotConnectedCodeResolver` | No conectado: ídem |
| `BulkImportAccessPolicyPort` | `PdpAccessPolicyAdapter` (real, `AuthzPdpService`) | Escrito; sin base real no se ejercitó |
| `BulkImportAuditPort` | `TrailAuditAdapter` (real, `AuditTrailService`) | Escrito; sin base real no se ejercitó |

Los dobles de prueba (`testing/fakes.ts`) no están en el grafo de inyección. Nada de lo ejercitado contra
ellos es evidencia del colaborador real (regla 65).

## Bloqueado / pendiente

- **Tabla del lote (BLOQUEADO, `mantra-core-health-model`).** No existe tabla para el lote
  (estado, declaración, contadores, clave de confirmación única por organización, informe) ni para el
  registro de filas procesadas. Se evaluaron `terminology.catalog_import_batches` (exige `source_id` de
  terminología) y `health_data.health_ingestion_batches` (exige una conexión de fuente y no tiene origen
  declarado ni base legal; no cubre usuarios). Hace falta una fuente de verdad en el modelo, con retención
  mínima de filas y unicidad `(organización, clave de confirmación)`. Sin DDL ni sincronización del ORM acá.
- **Adaptador de alta de usuarios**: usar `IamAssistedRegistrationService` /
  `assistedRegisterPractitioner` (la cuenta nace pendiente). El token de activación **no** puede volver al
  motor ni al informe: falta definir cómo se entrega (¿correo vía `EmailNoticePort`?). Decisión de negocio.
- **Adaptador clínico**: escribir por los servicios de `clinical`/`chart` con procedencia en
  `health_data.health_provenance_records`, y el contrato «sólo agrega» del puerto. La nota exige perfil de
  autor (`authorLicenseNumber` → profesional).
- **Resolutor de pacientes**: la búsqueda por documento vive en `PatientProfilesRepository.searchPage`
  (`common.identifiers` + `persons.birth_date`); falta definir qué es «consentimiento revocado» en
  `consent.*` (a confirmar con el DPO).
- **Resolutor de códigos**: `code_systems.internal_code` → versión vigente → `catalog_concepts`; falta
  decidir qué versión es la vigente.
- **Cola durable**: el procesamiento es en proceso; un reinicio deja el lote en `PROCESANDO`/`EN_COLA`.
- Documentación OpenAPI regenerada: no se hizo.
