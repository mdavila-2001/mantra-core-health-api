<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/identity_assurance/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver docs/progress/ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `identity_assurance`

**Fuente:** [`src/modules/identity_assurance/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/identity_assurance/README.md)
· 8 controllers · 11 services · 10 repositories · 11 entidades · 17 DTO

---

# src / modules / identity assurance

Agrupa los componentes relacionados con **identity assurance** y mantiene cohesionada esta responsabilidad del sistema.

## Rutas HTTP y alcance (medido)

<!-- Medido el 2026-10-08 sobre origin/dev (dae4fd68). Repetir con:
  find src/modules/identity_assurance -name '*.controller.ts' | wc -l
  find src/modules/identity_assurance -name '*.controller.ts' -exec grep -hE "^\s*@(Get|Post|Put|Patch|Delete)\(" {} + | wc -l
  find src/modules/identity_assurance -name '*.entity.ts' | wc -l
  find src/modules/identity_assurance -name '*.service.ts' | wc -l
La tabla sale de los decoradores `@Controller`/`@Get`/`@Post`/`@Put`/`@Patch`/`@Delete`, `@Roles` y `@Public`. -->

El módulo tiene **8 controllers, 27 rutas HTTP, 11 entidad y 11 servicios**. La columna *Acceso* sale del código: `pública` = `@Public()`; un rol = `@Roles(...)`; `sesión` = sin ninguno de los dos, o sea que sólo exige sesión autenticada (guards globales `JwtAuthGuard`, `TenantScopeGuard`, `RolesGuard`, `VerifiedIdentityGuard`). La autorización por recurso puede vivir además en el servicio y no se refleja acá.

Si una tabla narrativa más abajo difiere de ésta (prefijo del controller omitido, sufijos `:accion` de la spec en lugar de sub-rutas), manda ésta: sale del código.

Importa (`StorageLifecycleModule`, `IdentityEvidenceLifecycleModule`, `ProfilesModule`, `DirectoryModule`, `CommunityModule`).

Entidades (`tableName`, 11 de 11 archivos `*.entity.ts`): `identity_assertions`, `identity_authorities`, `identity_authority_endpoints`, `identity_check_results`, `identity_checks`, `identity_evidence_records`, `identity_fraud_signals`, `identity_manual_review_cases`, `identity_verification_attempts`, `identity_verification_cases`, `identity_verification_policies`.

| Método y ruta | Acceso | Controller |
| --- | --- | --- |
| `POST /identity/assertions/:id/revoke` | SECURITY_ADMIN | `identity-assertions` |
| `POST /identity/authorities` | SECURITY_ADMIN | `identity-authorities` |
| `POST /identity/authorities/:id/endpoints` | SECURITY_ADMIN | `identity-authorities` |
| `GET /identity/verification-cases` | SECURITY_ADMIN | `identity-cases` |
| `POST /identity/verification-cases/expire-sweep` | SYSTEM, SECURITY_ADMIN | `identity-cases` |
| `POST /identity/verification-cases` | SECURITY_ADMIN | `identity-cases` |
| `POST /identity/verification-cases/:id/evidence` | SECURITY_ADMIN | `identity-cases` |
| `POST /identity/verification-cases/:id/checks\\:plan` | SECURITY_ADMIN | `identity-cases` |
| `POST /identity/verification-cases/:id/fraud-signals` | SECURITY_ADMIN | `identity-cases` |
| `POST /identity/verification-cases/:id/manual-review` | SECURITY_ADMIN | `identity-cases` |
| `POST /identity/verification-cases/:id/assertions` | SECURITY_ADMIN | `identity-cases` |
| `POST /identity/checks/:id/attempts` | SECURITY_ADMIN | `identity-checks` |
| `POST /identity/checks/:id/results` | SECURITY_ADMIN | `identity-checks` |
| `POST /identity/manual-review/:id/decision` | SECURITY_ADMIN | `identity-manual-review` |
| `POST /identity/verification-policies` | SECURITY_ADMIN | `identity-policies` |
| `POST /identity/me/identity-verification` | sesión | `identity-self-service` |
| `POST /identity/me/practitioner/identity-verification` | sesión | `identity-self-service` |
| `POST /identity/me/practitioner/license-verification` | sesión | `identity-self-service` |
| `POST /identity/me/tenants/:tenantId/verification` | sesión | `identity-self-service` |
| `GET /identity/me/verification-types` | sesión | `identity-self-service` |
| `GET /identity/me/verification-cases` | sesión | `identity-self-service` |
| `GET /identity/me/verification-cases/:caseId` | sesión | `identity-self-service` |
| `POST /internal/identity/evidence/storage-purge-review` | SYSTEM | `identity-worker` |
| `POST /internal/identity/evidence/lifecycle-scan` | SYSTEM | `identity-worker` |
| `GET /internal/identity/checks/dispatchable` | SYSTEM, SECURITY_ADMIN | `identity-worker` |
| `POST /internal/identity/checks/:id/attempts` | SYSTEM, SECURITY_ADMIN | `identity-worker` |
| `POST /internal/identity/checks/:id/results` | SYSTEM, SECURITY_ADMIN | `identity-worker` |

## Contenido

### Subcarpetas

- [`controllers/`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/identity_assurance/controllers/README.md): Adaptadores HTTP que validan solicitudes, aplican autorización y delegan la lógica en servicios.
- [`dto/`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/identity_assurance/dto/README.md): Contratos de entrada y salida, validación y documentación de la API.
- [`entities/`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/identity_assurance/entities/README.md): Entidades y relaciones que representan el modelo persistente.
- [`repositories/`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/identity_assurance/repositories/README.md): Consultas y operaciones de persistencia aisladas de la lógica de negocio.
- [`services/`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/identity_assurance/services/README.md): Casos de uso, reglas de negocio y coordinación transaccional.

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `identity_assurance.concepts.ts` | Implementación o recurso de soporte de esta carpeta. |
| `identity_assurance.module.ts` | Composición de dependencias del módulo NestJS. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.

## Revisión backend 2026-10-05

La [revisión estricta](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/docs/revision-backend-2026-10-04/modulos/identity_assurance.md)
identifica que los comandos administrativos de casos y evidencia no atan el UUID
al tenant ni al sujeto autorizado. La corrida dirigida pasó 17 suites y 139 tests,
sin cobertura de RLS, archivos o dos tenants reales.
