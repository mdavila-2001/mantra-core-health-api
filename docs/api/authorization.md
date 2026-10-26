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
`CLINICIAN`) están reservados: `POST /authz/roles` responde 409 `ROLE_CODE_RESERVED` si se pide uno.

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
| Membresía de la organización | `TenantAdministrationService.assertCanAdminister/assertCanRead/canAdminister`, `InsurerContextService`, `LinkedClaimAccessService` | `/tenants/:tenantId/*`, agenda de la organización, seguros, listado de prácticas y sedes (`GET /practices`, `GET /practices/:practiceId/sites`: un rol clínico o de programación **o** `OWNER`/`ADMIN` de la organización, con el mismo 403 `ROLE_INSUFFICIENT` para el resto) |
| Guard propio | Un guard de clase en lugar de `@Roles` | `LabStaffGuard` en recepción de muestras y laboratorio |
| Catálogo de lectura abierta | Datos publicados, iguales para toda sesión, acotados por tenant (RLS) | directorio de farmacias y de unidades diagnósticas, terminología, temas de la comunidad |

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

### Prácticas visibles para un `PRACTITIONER`

El tenant no basta para aislar a los médicos auto-registrados: todos comparten el tenant `DEFAULT`.
`PracticeAccessService` (`src/modules/practice/services/practice-access.service.ts`) es el dueño
único de la regla: `SECURITY_ADMIN` o `ACCOUNTING_APPROVER` ven todas las prácticas; quien no es
`PRACTITIONER` no se filtra; un `PRACTITIONER` sólo ve las prácticas donde tiene una vinculación
ACTIVE vigente. `GET /practices` filtra con ella y `GET /practices/:practiceId/organization`
responde 404 —igual que ante una práctica inexistente o de otro tenant— cuando no se cumple.
Contabilidad usa el mismo criterio (`practiceAccessScope`) y lo traduce a sus propios 422.

## Convención de mutaciones sin política explícita

El analizador `tools/alovida/coverage-report.mjs` (regla `ORPHAN_ENDPOINT`) exige que todo endpoint
mutante (POST/PUT/PATCH/DELETE) declare explícitamente `@Roles(...)` o `@Public()` — no puede
quedar en la ambigüedad de "protegido solo por estar autenticado". Estado actual: **0** endpoints
mutantes sin esa política explícita (verificado en Fase 0, `docs/reports/baseline.md`).
