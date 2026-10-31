# Endpoints sin `@Roles` — lote 2

Autorización declarada de los endpoints del Anexo A de la auditoría del 31/10/2026 (tarea O3-3,
hallazgo H-1) en todos los módulos menos `community`, `profiles`, `directory` e `insurance`, más
los mutantes de esos módulos que la lectura por handler de `coverage-report.mjs` encuentra sin
declaración. Commit base: `78dd3646` (`origin/dev`).

## Cómo se autoriza una ruta en esta API

- **Autenticación**: `JwtAuthGuard` es `APP_GUARD` global (`src/common/auth/auth.module.ts`).
  Toda ruta exige un JWT válido salvo las marcadas con `@Public()`.
- **Rol**: `RolesGuard` (también global) sólo actúa si el handler o la clase declaran
  `@Roles(...)`. `SUPERADMIN` de plataforma pasa siempre; un rol con ámbito (`scopedRoles`) sólo
  vale en su tenant.
- **«Cualquier usuario autenticado»** se expresa **sin decorador**: no hay un `@Authenticated()`
  en el repo. Que una ruta sin `@Roles` sea deliberada se documenta en dos listas:
  - `tools/catalog/permission-drift-allowlist.json` → `reviewed`: grupos con motivo y evidencia.
    Lo hace cumplir `permission-drift-gate.mjs` contra las rutas que Nest registra (necesita
    `yarn build` y base de datos).
  - `tools/alovida/exenciones.mjs` (`SIN_ROLES_AUTORIZADOS`): la lista de los chequeos estáticos.
- **Recurso o membresía**: la mayoría de las rutas sin `@Roles` se autorizan en el servicio
  (dueño del recurso, membresía OWNER/ADMIN, evaluador de infraestructura §0.3). El dueño de una
  organización entra con rol global `USER`: un `@Roles` lo dejaría afuera.
- **Guard de clase**: `@UseGuards(LabStaffGuard)` autoriza la recepción y el laboratorio.

## La puerta ORPHAN_ENDPOINT

`node tools/alovida/coverage-report.mjs --fail-on-orphan` sale con código 1 si queda algún
endpoint mutante (`@Post/@Put/@Patch/@Delete`) sin `@Roles` ni `@Public` en su handler ni en su
clase, y lo lista en stderr con su ruta completa. Sin el flag el informe es informativo (exit 0).
Las pruebas están en `tools/alovida/coverage-report.test.mjs`
(`node --test tools/alovida/coverage-report.test.mjs`).

No cuentan como huérfanos: `@UseGuards(LabStaffGuard)` en la clase o el handler, las rutas de
los grupos `reviewed` de `permission-drift-allowlist.json` (las `routes` sin revisar **no**
eximen), las entradas de `exenciones.mjs` y los controladores de `AUTHN_NON_ROLE_ALLOWLIST`.

La lectura de decoradores es por handler y por clase. Hasta el commit base bastaba con que el
archivo nombrara `@Roles(` en un método cualquiera para eximir a todos los demás, y un `@Roles`
escrito debajo del verbo de un handler se le acreditaba al siguiente.

### Conteo

| Medición | ORPHAN_ENDPOINT |
|---|---:|
| Commit base, script del commit base (archivo con algún `@Roles` = eximido) | 27 |
| Commit base, lectura por handler y clase, sin leer `permission-drift-allowlist` | 117 |
| Commit base, lectura por handler y clase + rutas `reviewed` + `LabStaffGuard` | 52 |
| Con este cambio (dos `@Roles` agregados) | 50 |
| Con este cambio + los tres grupos `reviewed` nuevos de `permission-drift-allowlist.json` | 0 |

Los 50 son todos de este lote: `practice` (28), `clinical` (11), `billing` (4),
`procedures_perioperative` (3), `accounting` (2) y `diagnostic_units` (2). En `community`,
`profiles`, `directory` e `insurance` la puerta no encuentra mutantes sin declaración: los que
no llevan `@Roles` están revisados en `permission-drift-allowlist.json` o en
`AUTHN_NON_ROLE_ALLOWLIST`.

La puerta no mide lecturas (`GET`). Las del Anexo A de este lote figuran abajo con su mecanismo.

## Cambios de autorización

| Ruta | Antes | Ahora | Por qué |
|---|---|---|---|
| `POST /sites/:siteId/regulatory/verify-snis` | Sin `@Roles`; el servicio rechazaba a quien no fuera SECURITY_ADMIN o SUPERADMIN | `@Roles('SECURITY_ADMIN', 'SUPERADMIN')`; el servicio sigue comprobando | Es la única ruta de plataforma de una clase que autoriza por membresía. Mismos roles que el servicio: nadie que pasaba deja de pasar, salvo un rol con ámbito fuera de su tenant. |
| `POST /integrations/messages\:outbound` | Sin `@Roles`: cualquier sesión con tenant activo encolaba un mensaje saliente sobre una conexión del tenant | `@Roles('SYSTEM', 'SECURITY_ADMIN')` | El actor de UC-12-05 es un «Servicio de Negocio (productor)», no una persona. Mismos roles que las otras acciones de `IntegrationsMessagesController`. Ni el front ni la app móvil llaman a esta ruta; el smoke la ejerce como `SUPERADMIN`. |

## Anexo A, lote 2 (66 endpoints)

Línea actual del decorador HTTP. El Anexo nombra `PATCH /practice/:id` para
`infrastructure-catalog.controller.ts:65`: es `PATCH /site-licenses/:id`, la segunda clase del
archivo.

| Método | Ruta | Archivo (bajo `src/modules/`) | Quién autoriza | Estado |
|---|---|---|---|---|
| GET | `/clinical-units/:id` | `practice/controllers/clinical-units.controller.ts:47` | `StructureAccessService`: fila del tenant activo (si no, 404); leer, `assertCanRead`; escribir, `assertCanWriteSite` (admin de la organización o de la sucursal de la sede) o `assertCanAdministerOrganization`. | Grupo nuevo en `permission-drift-allowlist` (diff propuesto) |
| PATCH | `/clinical-units/:id` | `practice/controllers/clinical-units.controller.ts:63` | `StructureAccessService`: fila del tenant activo (si no, 404); leer, `assertCanRead`; escribir, `assertCanWriteSite` (admin de la organización o de la sucursal de la sede) o `assertCanAdministerOrganization`. | Grupo nuevo en `permission-drift-allowlist` (diff propuesto) |
| POST | `/clinical-units/:id/lifecycle` | `practice/controllers/clinical-units.controller.ts:82` | `StructureAccessService`: fila del tenant activo (si no, 404); leer, `assertCanRead`; escribir, `assertCanWriteSite` (admin de la organización o de la sucursal de la sede) o `assertCanAdministerOrganization`. | Grupo nuevo en `permission-drift-allowlist` (diff propuesto) |
| GET | `/practice/infrastructure-catalog` | `practice/controllers/infrastructure-catalog.controller.ts:44` | Catálogo global (formas, funciones, reglas): no lee datos de ningún tenant; exige sesión. | Grupo nuevo en `permission-drift-allowlist` (diff propuesto) |
| PATCH | `/site-licenses/:id` | `practice/controllers/infrastructure-catalog.controller.ts:65` | `StructureAccessService`: fila del tenant activo (si no, 404); leer, `assertCanRead`; escribir, `assertCanWriteSite` (admin de la organización o de la sucursal de la sede) o `assertCanAdministerOrganization`. | Grupo nuevo en `permission-drift-allowlist` (diff propuesto) |
| DELETE | `/practices/:practiceId/sites/:siteId` | `practice/controllers/practices.controller.ts:263` | `StructureAccessService`: fila del tenant activo (si no, 404); leer, `assertCanRead`; escribir, `assertCanWriteSite` (admin de la organización o de la sucursal de la sede) o `assertCanAdministerOrganization`. | Grupo nuevo en `permission-drift-allowlist` (diff propuesto) |
| GET | `/practices/:practiceId/healthcare-services` | `practice/controllers/practices.controller.ts:326` | Membresía administrativa: `PracticeAdministrationService.assertCanAdministerPractice` (404 si no existe, 403 si administra otra organización; pasa la plataforma). | Revisado en `permission-drift-allowlist` |
| PATCH | `/practices/:practiceId/healthcare-services/:id` | `practice/controllers/practices.controller.ts:351` | Membresía administrativa: `PracticeAdministrationService.assertCanAdministerPractice` (404 si no existe, 403 si administra otra organización; pasa la plataforma). | Revisado en `permission-drift-allowlist` |
| POST | `/role-assignments/:roleId/reject` | `practice/controllers/role-assignments.controller.ts:90` | Membresía administrativa: `PracticeAdministrationService.assertCanAdministerPractice` (404 si no existe, 403 si administra otra organización; pasa la plataforma). | Revisado en `permission-drift-allowlist` |
| POST | `/sites/:siteId/care-spaces` | `practice/controllers/sites.controller.ts:119` | `StructureAccessService`: fila del tenant activo (si no, 404); leer, `assertCanRead`; escribir, `assertCanWriteSite` (admin de la organización o de la sucursal de la sede) o `assertCanAdministerOrganization`. | Grupo nuevo en `permission-drift-allowlist` (diff propuesto) |
| POST | `/common/files/upload` | `common/controllers/common-files.controller.ts:78` | Archivos propios: el servicio exige ser quien subió el archivo o un rol de revisión (`canActorReadOwnFile`). | Revisado en `permission-drift-allowlist` |
| GET | `/common/files/links` | `common/controllers/common-files.controller.ts:114` | Archivos propios: el servicio exige ser quien subió el archivo o un rol de revisión (`canActorReadOwnFile`). | Revisado en `permission-drift-allowlist` |
| GET | `/common/files/:id/content` | `common/controllers/common-files.controller.ts:126` | Archivos propios: el servicio exige ser quien subió el archivo o un rol de revisión (`canActorReadOwnFile`). | Revisado en `permission-drift-allowlist` |
| POST | `/common/files` | `common/controllers/common-files.controller.ts:156` | Archivos propios: el servicio exige ser quien subió el archivo o un rol de revisión (`canActorReadOwnFile`). | Revisado en `permission-drift-allowlist` |
| POST | `/common/files/:id/versions` | `common/controllers/common-files.controller.ts:174` | Archivos propios: el servicio exige ser quien subió el archivo o un rol de revisión (`canActorReadOwnFile`). | Revisado en `permission-drift-allowlist` |
| POST | `/common/files/:id/versions/:vid/derivatives` | `common/controllers/common-files.controller.ts:191` | Archivos propios: el servicio exige ser quien subió el archivo o un rol de revisión (`canActorReadOwnFile`). | Revisado en `permission-drift-allowlist` |
| POST | `/common/files/:id/links` | `common/controllers/common-files.controller.ts:215` | Archivos propios: el servicio exige ser quien subió el archivo o un rol de revisión (`canActorReadOwnFile`). | Revisado en `permission-drift-allowlist` |
| DELETE | `/common/files/:id` | `common/controllers/common-files.controller.ts:233` | Archivos propios: el servicio exige ser quien subió el archivo o un rol de revisión (`canActorReadOwnFile`). | Revisado en `permission-drift-allowlist` |
| POST | `/common/files/:id/download-url` | `common/controllers/common-files.controller.ts:255` | Archivos propios: el servicio exige ser quien subió el archivo o un rol de revisión (`canActorReadOwnFile`). | Revisado en `permission-drift-allowlist` |
| POST | `/telemetry/disclosure-acceptances` | `telemetry/presentation/controllers/telemetry-consent.controller.ts:51` | Telemetría del titular: el sujeto es la sesión; no recibe otro usuario por parámetro. | Revisado en `permission-drift-allowlist` |
| POST | `/telemetry/tracking-consents` | `telemetry/presentation/controllers/telemetry-consent.controller.ts:69` | Telemetría del titular: el sujeto es la sesión; no recibe otro usuario por parámetro. | Revisado en `permission-drift-allowlist` |
| GET | `/telemetry/tracking-consents/me` | `telemetry/presentation/controllers/telemetry-consent.controller.ts:80` | Telemetría del titular: el sujeto es la sesión; no recibe otro usuario por parámetro. | Revisado en `permission-drift-allowlist` |
| POST | `/telemetry/tracking-consents/:id/withdraw` | `telemetry/presentation/controllers/telemetry-consent.controller.ts:111` | Telemetría del titular: el sujeto es la sesión; no recibe otro usuario por parámetro. | Revisado en `permission-drift-allowlist` |
| POST | `/telemetry/activity-events` | `telemetry/presentation/controllers/telemetry-events.controller.ts:49` | Telemetría del titular: el sujeto es la sesión; no recibe otro usuario por parámetro. | Revisado en `permission-drift-allowlist` |
| POST | `/telemetry/client-contexts` | `telemetry/presentation/controllers/telemetry-events.controller.ts:67` | Telemetría del titular: el sujeto es la sesión; no recibe otro usuario por parámetro. | Revisado en `permission-drift-allowlist` |
| POST | `/telemetry/web-vitals` | `telemetry/presentation/controllers/telemetry-events.controller.ts:84` | Telemetría del titular: el sujeto es la sesión; no recibe otro usuario por parámetro. | Revisado en `permission-drift-allowlist` |
| POST | `/telemetry/conversion-events` | `telemetry/presentation/controllers/telemetry-events.controller.ts:102` | Telemetría del titular: el sujeto es la sesión; no recibe otro usuario por parámetro. | Revisado en `permission-drift-allowlist` |
| POST | `/telemetry/session-journeys/:id/close` | `telemetry/presentation/controllers/telemetry-events.controller.ts:118` | Telemetría del titular: el sujeto es la sesión; no recibe otro usuario por parámetro. | Revisado en `permission-drift-allowlist` |
| GET | `/terminology/concepts` | `terminology/controllers/terminology-concepts.controller.ts:153` | Lectura de referencia publicada (terminología, enums dinámicos). | Revisado en `permission-drift-allowlist` |
| GET | `/terminology/concepts/glossary-graph` | `terminology/controllers/terminology-concepts.controller.ts:250` | Lectura de referencia publicada (terminología, enums dinámicos). | Revisado en `permission-drift-allowlist` |
| GET | `/terminology/concepts/:conceptId/glossary-neighborhood` | `terminology/controllers/terminology-concepts.controller.ts:289` | Lectura de referencia publicada (terminología, enums dinámicos). | Revisado en `permission-drift-allowlist` |
| GET | `/terminology/concepts/:conceptId/glossary-article` | `terminology/controllers/terminology-concepts.controller.ts:318` | Lectura de referencia publicada (terminología, enums dinámicos). | Revisado en `permission-drift-allowlist` |
| GET | `/terminology/concepts/:conceptId` | `terminology/controllers/terminology-concepts.controller.ts:344` | Lectura de referencia publicada (terminología, enums dinámicos). | Revisado en `permission-drift-allowlist` |
| POST | `/terminology/ConceptMap/$translate` | `terminology/controllers/terminology-fhir.controller.ts:101` | Consulta abierta; el curado (con `targetConceptId`) exige `CURATOR_ROLES` en `ConceptMapsService.curate` (403). | Revisado en `permission-drift-allowlist` |
| GET | `/terminology/CodeSystem/$lookup` | `terminology/controllers/terminology-fhir.controller.ts:122` | Lectura de referencia publicada (terminología, enums dinámicos). | Revisado en `permission-drift-allowlist` |
| GET | `/org/support-catalog` | `delegated_access/controllers/support-staff.controller.ts:196` | `SupportStaffService.assertOrganizationAdmin`: OWNER/ADMIN del hospital activo o rol de plataforma con alcance; si no, 403. | Revisado en `permission-drift-allowlist` |
| POST | `/org/support-engagement-requests/:id/decision` | `delegated_access/controllers/support-staff.controller.ts:229` | `SupportStaffService.assertOrganizationAdmin`: OWNER/ADMIN del hospital activo o rol de plataforma con alcance; si no, 403. | Revisado en `permission-drift-allowlist` |
| GET | `/org/support-engagements` | `delegated_access/controllers/support-staff.controller.ts:246` | `SupportStaffService.assertOrganizationAdmin`: OWNER/ADMIN del hospital activo o rol de plataforma con alcance; si no, 403. | Revisado en `permission-drift-allowlist` |
| POST | `/org/support-engagements/:id/end` | `delegated_access/controllers/support-staff.controller.ts:263` | `SupportStaffService.assertOrganizationAdmin`: OWNER/ADMIN del hospital activo o rol de plataforma con alcance; si no, 403. | Revisado en `permission-drift-allowlist` |
| POST | `/org/team/invitations` | `delegated_access/controllers/support-staff.controller.ts:280` | `SupportStaffService.assertOrganizationAdmin`: OWNER/ADMIN del hospital activo o rol de plataforma con alcance; si no, 403. | Revisado en `permission-drift-allowlist` |
| GET | `/billing/service-catalog` | `billing/controllers/billing-service-catalog.controller.ts:81` | Lectura del catálogo y del nomenclador para cotizar; el alta y la edición sí exigen rol o titularidad. | Revisado en `permission-drift-allowlist` |
| GET | `/billing/service-catalog/:id/image` | `billing/controllers/billing-service-catalog.controller.ts:136` | Servicio activo de una práctica del tenant activo (`assertResourceInTenant`); 404 uniforme. | Revisado en `permission-drift-allowlist` |
| GET | `/billing/service-catalog/procedure-specialties/mine` | `billing/controllers/billing-service-catalog.controller.ts:279` | Especialidades del profesional de la sesión; vacío si no es profesional. | Revisado en `permission-drift-allowlist` |
| GET | `/billing/service-catalog/procedures` | `billing/controllers/billing-service-catalog.controller.ts:299` | Lectura del catálogo y del nomenclador para cotizar; el alta y la edición sí exigen rol o titularidad. | Revisado en `permission-drift-allowlist` |
| POST | `/iam/auth/logout` | `iam/presentation/controllers/iam-auth.controller.ts:507` | Sesión propia: opera sobre `actor` (`@TenantAgnostic`). | Revisado en `permission-drift-allowlist` |
| POST | `/iam/auth/logout-all` | `iam/presentation/controllers/iam-auth.controller.ts:531` | Sesión propia: opera sobre `actor` (`@TenantAgnostic`). | Revisado en `permission-drift-allowlist` |
| POST | `/iam/users/:id/mfa-factors` | `iam/presentation/controllers/iam-users.controller.ts:431` | Titular de la cuenta (`actor.id === :id`) o rol de gestión (`ROLES_THAT_MANAGE_MFA`/`_DEVICES`); si no, 403. | Revisado en `permission-drift-allowlist` |
| POST | `/iam/users/:id/devices` | `iam/presentation/controllers/iam-users.controller.ts:448` | Titular de la cuenta (`actor.id === :id`) o rol de gestión (`ROLES_THAT_MANAGE_MFA`/`_DEVICES`); si no, 403. | Revisado en `permission-drift-allowlist` |
| GET | `/pharma-labs/notices/mine` | `pharma_lab/controllers/pharma-lab-notices.controller.ts:41` | Buzón propio: `recipientUserId = actor.id`; uno ajeno no se encuentra. | Revisado en `permission-drift-allowlist` |
| POST | `/pharma-labs/notices/:noticeId/read` | `pharma_lab/controllers/pharma-lab-notices.controller.ts:55` | Buzón propio: `recipientUserId = actor.id`; uno ajeno no se encuentra. | Revisado en `permission-drift-allowlist` |
| GET | `/pharma-labs/reference/concepts` | `pharma_lab/controllers/pharma-lab-reference.controller.ts:34` | Vocabulario estático del módulo; no expone datos de negocio. | Revisado en `permission-drift-allowlist` |
| GET | `/portals/:portalCode/routes/:routeCode/views/:viewCode/data` | `read_models/controllers/frontend-views.controller.ts:72` | `ViewContractAuthorizer.authorizeView`: audiencia, permiso, propósito y contexto del contrato de la vista; si no, 404. | Revisado en `permission-drift-allowlist` |
| GET | `/portals/:portalCode/routes/:routeCode/views/:viewCode/actions` | `read_models/controllers/frontend-views.controller.ts:113` | `ViewContractAuthorizer.authorizeView`: audiencia, permiso, propósito y contexto del contrato de la vista; si no, 404. | Revisado en `permission-drift-allowlist` |
| PUT | `/views/:frontendPageViewId/preferences` | `read_models/controllers/frontend-views.controller.ts:144` | Preferencias propias del usuario de la sesión; campos acotados al contrato de la vista. | Revisado en `permission-drift-allowlist` |
| POST | `/audio-assets/resolve` | `audio_assets/presentation/controllers/audio-assets.controller.ts:37` | Sólo plantillas registradas; el tenant del contexto entra en la identidad del asset y el cupo se imputa al sujeto. | Revisado en `permission-drift-allowlist` |
| GET | `/audio-assets/:assetId/content` | `audio_assets/presentation/controllers/audio-assets.controller.ts:48` | Sólo plantillas registradas; el tenant del contexto entra en la identidad del asset y el cupo se imputa al sujeto. | Revisado en `permission-drift-allowlist` |
| GET | `/diagnostic-units` | `diagnostic_units/controllers/diagnostic-units.controller.ts:86` | Directorio publicado del tenant activo (el servicio acota el id al tenant). | Revisado en `permission-drift-allowlist` |
| GET | `/diagnostic-units/:id` | `diagnostic_units/controllers/diagnostic-units.controller.ts:153` | Directorio publicado del tenant activo (el servicio acota el id al tenant). | Revisado en `permission-drift-allowlist` |
| GET | `/pharmacy/orders/:id` | `pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts:136` | Titular del pedido, plataforma, OWNER/ADMIN o personal de la farmacia del pedido; terceros, 404. | Revisado en `permission-drift-allowlist` |
| POST | `/pharmacy/orders/:id/conversation` | `pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts:156` | Titular del pedido, plataforma, OWNER/ADMIN o personal de la farmacia del pedido; terceros, 404. | Revisado en `permission-drift-allowlist` |
| GET | `/quotations` | `quotations/controllers/quotations.controller.ts:80` | `reachesPractice`: sólo prácticas que el actor alcanza; si no, 404. | Revisado en `permission-drift-allowlist` |
| GET | `/quotations/:id` | `quotations/controllers/quotations.controller.ts:106` | `reachesPractice`: sólo prácticas que el actor alcanza; si no, 404. | Revisado en `permission-drift-allowlist` |
| GET | `/` | `src/app.controller.ts:30` | Saludo fijo; no lee ni escribe datos (exige sesión). | Revisado en `permission-drift-allowlist` |
| POST | `/diagnostics/service-requests/inbox` | `diagnostics/controllers/diagnostics-reception.controller.ts:58` | `@UseGuards(LabStaffGuard)` de clase: SUPERADMIN, rol clínico en el tenant activo o membresía de un DIAGNOSTIC_CENTER; si no, 403. | Revisado en `permission-drift-allowlist` |
| POST | `/integrations/messages\:outbound` | `integrations/controllers/integrations-messages.controller.ts:63` | El actor de UC-12-05 es un servicio de negocio: mismos roles que el resto de la clase. | @Roles('SYSTEM', 'SECURITY_ADMIN') agregado |
| GET | `/system-context/dynamic-enums/bindings` | `system_context/controllers/system-context.controller.ts:93` | Lectura de referencia publicada (terminología, enums dinámicos). | Revisado en `permission-drift-allowlist` |

## Mutantes sin declaración fuera del Anexo A (46)

Los encuentra la lectura por handler y clase; el Anexo los omitió. Todos se autorizan en el
servicio y ninguno estaba en `permission-drift-allowlist.json`.

| Método | Ruta | Archivo (bajo `src/modules/`) | Quién autoriza | Estado |
|---|---|---|---|---|
| PATCH | `/accounting/infrastructure-items/:id` | `accounting/controllers/accounting-space.controller.ts:59` | `InfrastructureAccessService.assertCan`/`assertSiteLevel` (evaluador §0.3: tenant, alcance y rol de membresía sobre el recurso); otro tenant, 404; sin permiso, 403. | Grupo nuevo en `permission-drift-allowlist` (diff propuesto) |
| POST | `/accounting/cost-centers/:id/unit-link` | `accounting/controllers/accounting-space.controller.ts:93` | `InfrastructureAccessService.assertCan`/`assertSiteLevel` (evaluador §0.3: tenant, alcance y rol de membresía sobre el recurso); otro tenant, 404; sin permiso, 403. | Grupo nuevo en `permission-drift-allowlist` (diff propuesto) |
| POST | `/billing/space-tariffs` | `billing/controllers/billing-space-charges.controller.ts:131` | `InfrastructureAccessService.assertCan`/`assertSiteLevel` (evaluador §0.3: tenant, alcance y rol de membresía sobre el recurso); otro tenant, 404; sin permiso, 403. | Grupo nuevo en `permission-drift-allowlist` (diff propuesto) |
| POST | `/billing/space-tariffs/:id/close` | `billing/controllers/billing-space-charges.controller.ts:146` | `InfrastructureAccessService.assertCan`/`assertSiteLevel` (evaluador §0.3: tenant, alcance y rol de membresía sobre el recurso); otro tenant, 404; sin permiso, 403. | Grupo nuevo en `permission-drift-allowlist` (diff propuesto) |
| POST | `/billing/encounters/:encounterId/bed-day-charges/run` | `billing/controllers/billing-space-charges.controller.ts:180` | `InfrastructureAccessService.assertCan`/`assertSiteLevel` (evaluador §0.3: tenant, alcance y rol de membresía sobre el recurso); otro tenant, 404; sin permiso, 403. | Grupo nuevo en `permission-drift-allowlist` (diff propuesto) |
| POST | `/billing/charge-captures/:id/void` | `billing/controllers/billing-space-charges.controller.ts:199` | `InfrastructureAccessService.assertCan`/`assertSiteLevel` (evaluador §0.3: tenant, alcance y rol de membresía sobre el recurso); otro tenant, 404; sin permiso, 403. | Grupo nuevo en `permission-drift-allowlist` (diff propuesto) |
| POST | `/clinical/encounters/:id/bed-compatibility` | `clinical/controllers/clinical-adt.controller.ts:76` | `InfrastructureAccessService.assertCan`/`assertSiteLevel` (evaluador §0.3: tenant, alcance y rol de membresía sobre el recurso); otro tenant, 404; sin permiso, 403. | Grupo nuevo en `permission-drift-allowlist` (diff propuesto) |
| POST | `/clinical/bed-compatibility` | `clinical/controllers/clinical-adt.controller.ts:96` | `InfrastructureAccessService.assertCan`/`assertSiteLevel` (evaluador §0.3: tenant, alcance y rol de membresía sobre el recurso); otro tenant, 404; sin permiso, 403. | Grupo nuevo en `permission-drift-allowlist` (diff propuesto) |
| POST | `/clinical/admissions` | `clinical/controllers/clinical-adt.controller.ts:118` | `InfrastructureAccessService.assertCan`/`assertSiteLevel` (evaluador §0.3: tenant, alcance y rol de membresía sobre el recurso); otro tenant, 404; sin permiso, 403. | Grupo nuevo en `permission-drift-allowlist` (diff propuesto) |
| POST | `/clinical/encounters/:id/bed-assignment` | `clinical/controllers/clinical-adt.controller.ts:139` | `InfrastructureAccessService.assertCan`/`assertSiteLevel` (evaluador §0.3: tenant, alcance y rol de membresía sobre el recurso); otro tenant, 404; sin permiso, 403. | Grupo nuevo en `permission-drift-allowlist` (diff propuesto) |
| POST | `/clinical/encounters/:id/transfer` | `clinical/controllers/clinical-adt.controller.ts:164` | `InfrastructureAccessService.assertCan`/`assertSiteLevel` (evaluador §0.3: tenant, alcance y rol de membresía sobre el recurso); otro tenant, 404; sin permiso, 403. | Grupo nuevo en `permission-drift-allowlist` (diff propuesto) |
| POST | `/clinical/bed-swaps` | `clinical/controllers/clinical-adt.controller.ts:189` | `InfrastructureAccessService.assertCan`/`assertSiteLevel` (evaluador §0.3: tenant, alcance y rol de membresía sobre el recurso); otro tenant, 404; sin permiso, 403. | Grupo nuevo en `permission-drift-allowlist` (diff propuesto) |
| POST | `/clinical/encounters/:id/discharge` | `clinical/controllers/clinical-adt.controller.ts:211` | `InfrastructureAccessService.assertCan`/`assertSiteLevel` (evaluador §0.3: tenant, alcance y rol de membresía sobre el recurso); otro tenant, 404; sin permiso, 403. | Grupo nuevo en `permission-drift-allowlist` (diff propuesto) |
| POST | `/clinical/encounter-locations/:id/cancel` | `clinical/controllers/clinical-adt.controller.ts:236` | `InfrastructureAccessService.assertCan`/`assertSiteLevel` (evaluador §0.3: tenant, alcance y rol de membresía sobre el recurso); otro tenant, 404; sin permiso, 403. | Grupo nuevo en `permission-drift-allowlist` (diff propuesto) |
| PATCH | `/clinical/placement-incidents/:id` | `clinical/controllers/clinical-adt.controller.ts:311` | `InfrastructureAccessService.assertCan`/`assertSiteLevel` (evaluador §0.3: tenant, alcance y rol de membresía sobre el recurso); otro tenant, 404; sin permiso, 403. | Grupo nuevo en `permission-drift-allowlist` (diff propuesto) |
| POST | `/sites/:siteId/census/:date/close` | `clinical/controllers/clinical-adt.controller.ts:361` | `InfrastructureAccessService.assertCan`/`assertSiteLevel` (evaluador §0.3: tenant, alcance y rol de membresía sobre el recurso); otro tenant, 404; sin permiso, 403. | Grupo nuevo en `permission-drift-allowlist` (diff propuesto) |
| POST | `/census-days/:id/adjustments` | `clinical/controllers/clinical-adt.controller.ts:386` | `InfrastructureAccessService.assertCan`/`assertSiteLevel` (evaluador §0.3: tenant, alcance y rol de membresía sobre el recurso); otro tenant, 404; sin permiso, 403. | Grupo nuevo en `permission-drift-allowlist` (diff propuesto) |
| POST | `/diagnostic-equipment/:id/resource` | `diagnostic_units/controllers/diagnostic-equipment.controller.ts:49` | `InfrastructureAccessService.assertCan`/`assertSiteLevel` (evaluador §0.3: tenant, alcance y rol de membresía sobre el recurso); otro tenant, 404; sin permiso, 403. | Grupo nuevo en `permission-drift-allowlist` (diff propuesto) |
| PATCH | `/diagnostic-equipment/:id` | `diagnostic_units/controllers/diagnostic-equipment.controller.ts:75` | `InfrastructureAccessService.assertCan`/`assertSiteLevel` (evaluador §0.3: tenant, alcance y rol de membresía sobre el recurso); otro tenant, 404; sin permiso, 403. | Grupo nuevo en `permission-drift-allowlist` (diff propuesto) |
| POST | `/care-spaces/:id/availability` | `practice/controllers/care-space-ops.controller.ts:145` | `InfrastructureAccessService.assertCan`/`assertSiteLevel` (evaluador §0.3: tenant, alcance y rol de membresía sobre el recurso); otro tenant, 404; sin permiso, 403. | Grupo nuevo en `permission-drift-allowlist` (diff propuesto) |
| POST | `/care-space-blocks/:id/end` | `practice/controllers/care-space-ops.controller.ts:189` | `InfrastructureAccessService.assertCan`/`assertSiteLevel` (evaluador §0.3: tenant, alcance y rol de membresía sobre el recurso); otro tenant, 404; sin permiso, 403. | Grupo nuevo en `permission-drift-allowlist` (diff propuesto) |
| POST | `/care-space-blocks/:id/cancel` | `practice/controllers/care-space-ops.controller.ts:212` | `InfrastructureAccessService.assertCan`/`assertSiteLevel` (evaluador §0.3: tenant, alcance y rol de membresía sobre el recurso); otro tenant, 404; sin permiso, 403. | Grupo nuevo en `permission-drift-allowlist` (diff propuesto) |
| POST | `/care-spaces/:id/hygiene` | `practice/controllers/care-space-ops.controller.ts:235` | `InfrastructureAccessService.assertCan`/`assertSiteLevel` (evaluador §0.3: tenant, alcance y rol de membresía sobre el recurso); otro tenant, 404; sin permiso, 403. | Grupo nuevo en `permission-drift-allowlist` (diff propuesto) |
| POST | `/care-spaces/:id/isolation` | `practice/controllers/care-space-ops.controller.ts:260` | `InfrastructureAccessService.assertCan`/`assertSiteLevel` (evaluador §0.3: tenant, alcance y rol de membresía sobre el recurso); otro tenant, 404; sin permiso, 403. | Grupo nuevo en `permission-drift-allowlist` (diff propuesto) |
| POST | `/sites/:siteId/cleaning-orders` | `practice/controllers/care-space-ops.controller.ts:297` | `InfrastructureAccessService.assertCan`/`assertSiteLevel` (evaluador §0.3: tenant, alcance y rol de membresía sobre el recurso); otro tenant, 404; sin permiso, 403. | Grupo nuevo en `permission-drift-allowlist` (diff propuesto) |
| POST | `/cleaning-orders/:id/assign` | `practice/controllers/care-space-ops.controller.ts:319` | `InfrastructureAccessService.assertCan`/`assertSiteLevel` (evaluador §0.3: tenant, alcance y rol de membresía sobre el recurso); otro tenant, 404; sin permiso, 403. | Grupo nuevo en `permission-drift-allowlist` (diff propuesto) |
| POST | `/cleaning-orders/:id/start` | `practice/controllers/care-space-ops.controller.ts:344` | `InfrastructureAccessService.assertCan`/`assertSiteLevel` (evaluador §0.3: tenant, alcance y rol de membresía sobre el recurso); otro tenant, 404; sin permiso, 403. | Grupo nuevo en `permission-drift-allowlist` (diff propuesto) |
| POST | `/cleaning-orders/:id/finish` | `practice/controllers/care-space-ops.controller.ts:368` | `InfrastructureAccessService.assertCan`/`assertSiteLevel` (evaluador §0.3: tenant, alcance y rol de membresía sobre el recurso); otro tenant, 404; sin permiso, 403. | Grupo nuevo en `permission-drift-allowlist` (diff propuesto) |
| POST | `/cleaning-orders/:id/inspect` | `practice/controllers/care-space-ops.controller.ts:393` | `InfrastructureAccessService.assertCan`/`assertSiteLevel` (evaluador §0.3: tenant, alcance y rol de membresía sobre el recurso); otro tenant, 404; sin permiso, 403. | Grupo nuevo en `permission-drift-allowlist` (diff propuesto) |
| POST | `/cleaning-orders/:id/cancel` | `practice/controllers/care-space-ops.controller.ts:418` | `InfrastructureAccessService.assertCan`/`assertSiteLevel` (evaluador §0.3: tenant, alcance y rol de membresía sobre el recurso); otro tenant, 404; sin permiso, 403. | Grupo nuevo en `permission-drift-allowlist` (diff propuesto) |
| PATCH | `/care-spaces/:id` | `practice/controllers/care-spaces.controller.ts:78` | `StructureAccessService`: fila del tenant activo (si no, 404); leer, `assertCanRead`; escribir, `assertCanWriteSite` (admin de la organización o de la sucursal de la sede) o `assertCanAdministerOrganization`. | Grupo nuevo en `permission-drift-allowlist` (diff propuesto) |
| POST | `/care-spaces/:id/move` | `practice/controllers/care-spaces.controller.ts:97` | `StructureAccessService`: fila del tenant activo (si no, 404); leer, `assertCanRead`; escribir, `assertCanWriteSite` (admin de la organización o de la sucursal de la sede) o `assertCanAdministerOrganization`. | Grupo nuevo en `permission-drift-allowlist` (diff propuesto) |
| POST | `/care-spaces/:id/lifecycle` | `practice/controllers/care-spaces.controller.ts:117` | `StructureAccessService`: fila del tenant activo (si no, 404); leer, `assertCanRead`; escribir, `assertCanWriteSite` (admin de la organización o de la sucursal de la sede) o `assertCanAdministerOrganization`. | Grupo nuevo en `permission-drift-allowlist` (diff propuesto) |
| POST | `/care-spaces/:id/unit-assignments` | `practice/controllers/care-spaces.controller.ts:165` | `StructureAccessService`: fila del tenant activo (si no, 404); leer, `assertCanRead`; escribir, `assertCanWriteSite` (admin de la organización o de la sucursal de la sede) o `assertCanAdministerOrganization`. | Grupo nuevo en `permission-drift-allowlist` (diff propuesto) |
| DELETE | `/care-spaces/:id/unit-assignments/:assignmentId` | `practice/controllers/care-spaces.controller.ts:183` | `StructureAccessService`: fila del tenant activo (si no, 404); leer, `assertCanRead`; escribir, `assertCanWriteSite` (admin de la organización o de la sucursal de la sede) o `assertCanAdministerOrganization`. | Grupo nuevo en `permission-drift-allowlist` (diff propuesto) |
| POST | `/practices/:practiceId/sites` | `practice/controllers/practices.controller.ts:241` | `StructureAccessService`: fila del tenant activo (si no, 404); leer, `assertCanRead`; escribir, `assertCanWriteSite` (admin de la organización o de la sucursal de la sede) o `assertCanAdministerOrganization`. | Grupo nuevo en `permission-drift-allowlist` (diff propuesto) |
| POST | `/sites/:siteId/care-spaces/bulk` | `practice/controllers/site-infrastructure.controller.ts:86` | `StructureAccessService`: fila del tenant activo (si no, 404); leer, `assertCanRead`; escribir, `assertCanWriteSite` (admin de la organización o de la sucursal de la sede) o `assertCanAdministerOrganization`. | Grupo nuevo en `permission-drift-allowlist` (diff propuesto) |
| POST | `/sites/:siteId/care-spaces/import` | `practice/controllers/site-infrastructure.controller.ts:104` | `StructureAccessService`: fila del tenant activo (si no, 404); leer, `assertCanRead`; escribir, `assertCanWriteSite` (admin de la organización o de la sucursal de la sede) o `assertCanAdministerOrganization`. | Grupo nuevo en `permission-drift-allowlist` (diff propuesto) |
| PATCH | `/sites/:siteId/regulatory` | `practice/controllers/site-infrastructure.controller.ts:159` | `StructureAccessService`: fila del tenant activo (si no, 404); leer, `assertCanRead`; escribir, `assertCanWriteSite` (admin de la organización o de la sucursal de la sede) o `assertCanAdministerOrganization`. | Grupo nuevo en `permission-drift-allowlist` (diff propuesto) |
| POST | `/sites/:siteId/licenses` | `practice/controllers/site-infrastructure.controller.ts:225` | `StructureAccessService`: fila del tenant activo (si no, 404); leer, `assertCanRead`; escribir, `assertCanWriteSite` (admin de la organización o de la sucursal de la sede) o `assertCanAdministerOrganization`. | Grupo nuevo en `permission-drift-allowlist` (diff propuesto) |
| POST | `/sites/:siteId/declared-capacities` | `practice/controllers/site-infrastructure.controller.ts:261` | `StructureAccessService`: fila del tenant activo (si no, 404); leer, `assertCanRead`; escribir, `assertCanWriteSite` (admin de la organización o de la sucursal de la sede) o `assertCanAdministerOrganization`. | Grupo nuevo en `permission-drift-allowlist` (diff propuesto) |
| POST | `/sites/:siteId/clinical-units` | `practice/controllers/sites.controller.ts:68` | `StructureAccessService`: fila del tenant activo (si no, 404); leer, `assertCanRead`; escribir, `assertCanWriteSite` (admin de la organización o de la sucursal de la sede) o `assertCanAdministerOrganization`. | Grupo nuevo en `permission-drift-allowlist` (diff propuesto) |
| POST | `/sites/:siteId/or-blocks` | `procedures_perioperative/controllers/periop-or.controller.ts:260` | `InfrastructureAccessService.assertCan`/`assertSiteLevel` (evaluador §0.3: tenant, alcance y rol de membresía sobre el recurso); otro tenant, 404; sin permiso, 403. | Grupo nuevo en `permission-drift-allowlist` (diff propuesto) |
| POST | `/or-blocks/:id/release` | `procedures_perioperative/controllers/periop-or.controller.ts:281` | `InfrastructureAccessService.assertCan`/`assertSiteLevel` (evaluador §0.3: tenant, alcance y rol de membresía sobre el recurso); otro tenant, 404; sin permiso, 403. | Grupo nuevo en `permission-drift-allowlist` (diff propuesto) |
| POST | `/or-blocks/:id/cancel` | `procedures_perioperative/controllers/periop-or.controller.ts:310` | `InfrastructureAccessService.assertCan`/`assertSiteLevel` (evaluador §0.3: tenant, alcance y rol de membresía sobre el recurso); otro tenant, 404; sin permiso, 403. | Grupo nuevo en `permission-drift-allowlist` (diff propuesto) |
| POST | `/sites/:siteId/regulatory/verify-snis` | `practice/controllers/site-infrastructure.controller.ts:194` | Sólo plataforma: declara la regla que `SiteEstablishmentService.verifySnis` sigue comprobando. | @Roles('SECURITY_ADMIN', 'SUPERADMIN') agregado |

## Límites que esta página describe

- `GET /billing/service-catalog?practiceId=` no compara `practiceId` con el tenant activo en el
  código (`ServiceCatalogRepository.searchPage` filtra sólo por práctica); la acota la política
  RLS de la tabla, que depende de `RLS_ENFORCE`.
- `permission-drift-gate.mjs` arranca la aplicación compilada contra una base: no se ejecutó al
  escribir esta página. Las rutas de los tres grupos nuevos tampoco estaban en la lista en el
  commit base, así que ese gate ya las contaba como deriva.
