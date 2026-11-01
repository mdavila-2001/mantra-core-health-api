# Autorización

> Fase 5. Derivado de `src/common/auth/roles.guard.ts`, `src/modules/authz/` (módulo `authz`, hub
> de autorización transversal — ver `docs/architecture/module-dependencies.md` §3) y
> `src/common/tenant/tenant-context.interceptor.ts`.

## Dos capas de autorización

### 1. RBAC global (`RolesGuard` + `@Roles(...)`)

`RolesGuard` corre **después** de `JwtAuthGuard` (puede asumir `request.user` ya poblado).
Si el handler no declara `@Roles(...)`, no impone restricción adicional más allá de estar
autenticado. `@Roles('CLINICIAN', 'PRACTITIONER')` exige que el usuario tenga **al menos uno** de
los roles indicados (códigos de concepto, p. ej. `SECURITY_ADMIN`).

**`SUPERADMIN` es un comodín deliberado** (documentado así en el propio código): evita enumerar
cada rol en cada endpoint administrativo y concentra el privilegio total en un único rol. Tenerlo
en cuenta al diseñar el modelo de amenazas (Fase 12): comprometer una cuenta `SUPERADMIN` otorga
bypass de RBAC completo.

El comodín vale sólo para el `SUPERADMIN` de plataforma. Un código privilegiado (`SUPERADMIN`,
`SYSTEM`) que el token trae también en `scopedRoles` es una asignación acotada a un tenant: no es
comodín de RBAC, no habilita el barrido entre tenants ni declarar un tenant ajeno
(`hasPrivilegedTenantRole` y `roleAuthorizesInTenant` aplican la misma regla). Los códigos de rol
de plataforma (`SUPERADMIN`, `SYSTEM`, `SECURITY_ADMIN`, `USER`, `PATIENT`, `PRACTITIONER`,
`CLINICIAN`, `SUPPORT_STAFF`) están reservados: `POST /authz/roles` responde 409 `ROLE_CODE_RESERVED` si se pide uno.

Si el rol no alcanza: `403 FORBIDDEN` (`ErrorCode.FORBIDDEN`, ver `docs/api/error-model.md`).

**Deriva de permisos (gate de CI).** Una ruta autenticada sin `@Roles` ni `@Public` la pasa
cualquier sesión, y un rol que una ruta exige pero nadie siembra solo lo ejerce `SUPERADMIN`.
`yarn catalog:permission-drift` arranca la aplicación compilada, calcula esa deriva con
`computePermissionDrift` (la misma lógica de `GET /admin/catalog/permission-drift`) y falla si
aparece una ruta o un rol nuevos fuera de `tools/catalog/permission-drift-allowlist.json`. Es un
trinquete: una excepción que dejó de hacer falta también falla, de modo que la lista solo puede
encogerse; `--write` la reescribe con la deriva actual conservando los grupos revisados.

La lista distingue dos cosas. `reviewed` agrupa las rutas **revisadas**: cada grupo trae el
`reason` por el que la ruta no necesita `@Roles` (qué la autoriza en su lugar) y la `evidence`
(`archivo#símbolo`) donde se comprueba; el gate rechaza un grupo sin motivo, sin evidencia o con una
ruta repetida (`invalidAllowlist`), y una prueba unitaria verifica que cada archivo y símbolo citado
existan. `routes` lleva las rutas **sin revisar**, que no tienen motivo escrito.

**Quién autoriza una ruta sin `@Roles`.** Un `@Roles` global solo responde «¿qué rol tiene el
actor?»; hay decisiones que necesitan otro dato y por eso se toman en el servicio o en un guard
propio. Las rutas revisadas caen en estas clases:

| Clase | Quién decide | Ejemplos |
|---|---|---|
| Autoservicio por sesión | El sujeto sale de la sesión (`/me`, vínculo de la cuenta), no de un parámetro | `/profiles/*/me`, `/charts/me`, `/forms/me`, telemetría, cuestionarios del paciente |
| Titularidad del recurso | El servicio compara el dueño con el actor (`ProfileOwnershipService`, `CommunityVisibilityService.assertActsAsProfile`, `canActorMutateOwnFile`) | perfiles, archivos, red social, encuestas, MFA y dispositivos de `/iam/users/:id` |
| Membresía de la organización | `TenantAdministrationService.assertCanAdminister/assertCanRead/administersByMembership`, `InsurerContextService`, `LinkedClaimAccessService` | `/tenants/:tenantId/*`, agenda de la organización, seguros, listado de prácticas y sedes (`GET /practices`, `GET /practices/:practiceId/sites`: un rol clínico o de programación (respetando `scopedRoles`) **o** `OWNER`/`ADMIN` activo de la organización por membresía, con el mismo 403 `ROLE_INSUFFICIENT` para el resto) |
| Guard propio | Un guard de clase en lugar de `@Roles` | `LabStaffGuard` en recepción de muestras y laboratorio |
| Catálogo de lectura abierta | Datos publicados, iguales para toda sesión, acotados por tenant (RLS) | directorio de farmacias y de unidades diagnósticas, terminología, temas de la comunidad |

En la clase de membresía, `TenantAdministrationService` deja pasar sin consultar membresías a un
`SECURITY_ADMIN` o `SUPERADMIN` que autoriza **en el tenant objetivo** según `roleAuthorizesInTenant`:
el concedido sin ámbito vale en cualquier organización; el acotado al tenant A en `scopedRoles`
administra, lee y cambia los dueños de A, pero en el tenant B solo cuenta su membresía en B (sin ella,
`403`). Cada operación del servicio recibe el tenant objetivo, así que no existe un atajo «sin tenant».

**Rutas de farmacia, laboratorio y gastos del paciente.**

- `GET /patient-spending/me` lleva `@Roles('PATIENT')` y no recibe identificador de persona: el titular
  sale del token, así que solo se leen los gastos propios. La lectura queda en el registro de accesos
  (`@AccessLogged`, recurso `PATIENT_SPENDING`).
- El alta y la edición de productos y las guardias de una farmacia (`/pharmacies/:pharmacyId/...`)
  llevan `@Roles('SECURITY_ADMIN', 'PHARMACY_STAFF')` y `PharmacyTenantScopeGuard`: el personal solo
  opera sobre la farmacia de su membresía, no sobre otra.
- `POST /tenants/:tenantId/affiliation-documents`, `GET /tenants/:tenantId/pharmacy-readiness` y
  `GET /tenants/:tenantId/laboratory-readiness` no llevan `@Roles`: decide el servicio de
  completado de documentos con la membresía de la organización (`403` si el actor no pertenece a ella).
- `GET /public/pharmacies/open-now`, `GET /public/profiles/f/:slug/branches` y
  `POST /public/profiles/f/:slug/branch-availability` son `@Public()`. El `POST` es una lectura: los
  renglones de la receta viajan en el cuerpo para no quedar en la URL, y no se guardan.

**Sonda de vida de instancias (`ops_console`).** `POST /internal/ops/heartbeats` lleva
`@Roles('SYSTEM')`: sólo el token que firma `SystemApiClient` en cada worker puede registrar un
latido, y un administrador de plataforma recibe `403` (nadie fabrica la vida de un proceso desde el
portal). `GET /admin/ops/instances/liveness` es de sólo lectura y exige los mismos `OPS_READ_ROLES`
(`PLATFORM_ADMIN`, `SRE`, `SECURITY_ADMIN`, `RELEASE_MANAGER`, `GOVERNANCE_ADMIN`) que el resto de
`/admin/ops`.

Una ruta que **escribe** con un dueño que viaja en el cuerpo y sin comprobación en el servicio
**no** entra en ninguna de estas clases y lleva `@Roles`: las altas de `/common/addresses`,
`/common/contact-points` e `/common/identifiers`, la verificación de un contacto y el estado de las
fuentes de datos (`/health/data-sources*`, topología interna) exigen un rol de administración.
`POST /terminology/ConceptMap/$translate` comparte ruta entre la consulta (cualquier sesión) y el
curado de un mapeo, que exige `SECURITY_ADMIN`, `TERMINOLOGY_ENGINEER` o `SUPERADMIN` en el servicio.
`GET /terminology/CodeSystem/$lookup` y `GET /terminology/concepts/:conceptId` filtran por audiencia las
propiedades de farmacología clínica: las filas con `audience: 'professional'` (posología incluida) las
reciben solo los roles asistenciales del catálogo de actores (`baseRole: 'CLINICAL'`) y el `SUPERADMIN`
de plataforma; un `PATIENT`, un `USER` o un `SECURITY_ADMIN` no (`src/modules/terminology/pharmacology-audience.ts`).

**Roles que no se siembran.** Los roles de negocio, plataforma y servicio que las rutas exigen se
siembran en `authz.roles` desde `authz.platform-roles.seed.ts` (y los `*.roles.ts` de cada módulo):
sembrar un rol solo lo hace asignable, nadie lo recibe por existir. Los de ámbito `GLOBAL` se
asignan sin tenant. `PHARMACY_STAFF` es la excepción: el login lo deriva de una membresía activa en
un tenant de farmacia (`withPharmacyStaffRole`) y no se siembra para que no pueda asignarse a mano.

### 2. PDP clínico aditivo (`authz` — acceso a PHI)

Un rol global (p. ej. `CLINICIAN`) **no basta por sí solo** para acceder a datos clínicos (PHI):
se exige además un **alcance clínico vigente**, evaluado por el PDP
(`src/modules/authz/services/authz-pdp.service.ts`) contra:

- `ClinicalAccessGrantsRepository` — concesiones de acceso clínico activas.
- `CareRelationshipsRepository` — relación asistencial vigente entre el profesional y el paciente.
- `PatientLegalRepresentationsRepository` — representación legal (tutores, apoderados).
- `ResourceScopeGrantsRepository` / `FieldPermissionsRepository` — alcance por recurso y campo.

**Rango de acción vs. nivel de grant** (`CLINICAL_ACTION_RANK`, orden creciente):

| Acción | Rango exigido | Nivel de grant mínimo |
|---|---:|---|
| `READ` | 1 | El más bajo cubre lectura |
| `WRITE`, `CREATE` | 2 | Requiere nivel intermedio |
| `DELETE`, `EXECUTE`, `APPROVE` | 3 | Requiere nivel `FULL` — acciones destructivas/administrativas |

Un grant solo cubre una acción si su nivel alcanza el rango exigido. Esto es lo que memoria de
sesiones previas describe como "PDP clínico conjuntivo": rol **Y** alcance clínico vigente, no
rol **O** alcance — ambas condiciones deben cumplirse.

**Invalidación de caché:** `InvalidateCacheDto`/`CacheInvalidationResultDto` — el PDP cachea
decisiones; revocar un consentimiento o una relación asistencial debe invalidar la caché asociada
(ver `docs/security/auditability.md`, Fase 12, para el flujo completo de revocación).

## Aislamiento por tenant

`TenantContextInterceptor` (`src/common/tenant/tenant-context.interceptor.ts`) — único interceptor
del sistema — fija el tenant activo para la request/transacción. Que Row-Level Security
(`RLS_ENFORCE`) esté activo depende de la configuración de cada entorno, no sólo del código — ver
[aislamiento por tenant](../security/tenant-isolation.md).

### Datasets de plataforma: AloVida Insights

`/marketing/insights/*` sirve tablas sin `tenant_id` (`marketing.insights_*`), así que no aísla por
tenant: aísla por rol. Cada handler declara `@Roles('MARKETING_MANAGER', 'PLATFORM_ADMIN',
'DATA_PLATFORM_ADMIN')` y la clase `@PlatformTenantOptional('SUPERADMIN', 'PLATFORM_ADMIN',
'DATA_PLATFORM_ADMIN')`. `MARKETING_MANAGER` es un rol de **tenant** (`scopedRoles`): no entra en la
lista tenant-opcional, así que `TenantScopeGuard` le exige `X-Tenant-Id` o una única membresía
(`403 TENANT_AMBIGUOUS` / `TENANT_REQUIRED` si no hay forma de resolverlo) y `RolesGuard` solo lo
autoriza en el tenant donde se le concedió (`403 ROLE_INSUFFICIENT` en otro). El dato devuelto es el
mismo en cualquier tenant. Los roles globales `PLATFORM_ADMIN` y `DATA_PLATFORM_ADMIN` leen sin
cabecera. `BUSINESS_ADMIN` nunca. Lo fija `src/modules/marketing/insights-access.spec.ts`.

Las **escrituras** del portal (alertas, preferencias, vistas guardadas, informes) usan los
mismos roles que las lecturas y llevan `@Audited`; `PATCH alert-rules/:code` (reglas compartidas)
exige solo `PLATFORM_ADMIN` y `DATA_PLATFORM_ADMIN` (`MARKETING_MANAGER` recibe 403). Alertas y reglas son compartidas; lo que es de la persona se acota
por el **id del usuario autenticado** (`user.id`), nunca por un `userId` de la petición: un usuario no
ve ni modifica filas de otro (`404` si manda un `id` ajeno). Las modificaciones de alertas y reglas se
protegen con `If-Match`/`row_version` (`412 MARKETING_INSIGHTS_VERSION_MISMATCH`).

### Prácticas visibles para un `PRACTITIONER`

El tenant no basta para aislar a los médicos auto-registrados: todos comparten el tenant `DEFAULT`.
`PracticeAccessService` (`src/modules/practice/services/practice-access.service.ts`) es el dueño
único de la regla: `SECURITY_ADMIN` o `ACCOUNTING_APPROVER` ven todas las prácticas; quien no es
`PRACTITIONER` no se filtra; un `PRACTITIONER` sólo ve las prácticas donde tiene una vinculación
ACTIVE vigente. `GET /practices` filtra con ella y `GET /practices/:practiceId/organization`
responde 404 —igual que ante una práctica inexistente o de otro tenant— cuando no se cumple.
Contabilidad usa el mismo criterio (`practiceAccessScope`) y lo traduce a sus propios 422.

Abrir el ejercicio fiscal (`POST /accounting/fiscal-years`) es más estricto que verlo: lo hacen la
administración (`SECURITY_ADMIN` o `ACCOUNTING_APPROVER`; `SUPERADMIN` por comodín) o el
`PRACTITIONER` titular de su consultorio propio (`PracticeTenantLookupService.isOwnOffice`: práctica
de tipo `OFFICE` con él como administrador). Un médico que atiende en una práctica que no es suya
recibe 403 (`FISCAL_YEAR_OPEN_NOT_ALLOWED`); una práctica de otra organización sigue respondiendo
404, antes de mirar el rol.

## Convención de mutaciones sin política explícita

El analizador `tools/alovida/coverage-report.mjs` (regla `ORPHAN_ENDPOINT`) exige que todo endpoint
mutante (POST/PUT/PATCH/DELETE) declare explícitamente `@Roles(...)` o `@Public()` — no puede
quedar en la ambigüedad de "protegido solo por estar autenticado". Estado actual: **0** endpoints
mutantes sin esa política explícita (verificado en Fase 0, `docs/reports/baseline.md`).
