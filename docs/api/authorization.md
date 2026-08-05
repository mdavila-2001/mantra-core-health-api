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

Si el rol no alcanza: `403 FORBIDDEN` (`ErrorCode.FORBIDDEN`, ver `docs/api/error-model.md`).

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
del sistema — fija el tenant activo para la request/transacción. La aplicación real de Row-Level
Security (`RLS_ENFORCE`) es una verificación operativa pendiente por entorno, no solo una
propiedad del código — ver `SEC-001` en `docs/governance/traceability-matrix.md`.

## Convención de mutaciones sin política explícita

El analizador `tools/redesa/coverage-report.mjs` (regla `ORPHAN_ENDPOINT`) exige que todo endpoint
mutante (POST/PUT/PATCH/DELETE) declare explícitamente `@Roles(...)` o `@Public()` — no puede
quedar en la ambigüedad de "protegido solo por estar autenticado". Estado actual: **0** endpoints
mutantes sin esa política explícita (verificado en Fase 0, `docs/reports/baseline.md`).
