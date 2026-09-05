> **Superado.** Este documento fija un hito histórico (primeros 30 endpoints, julio 2026). El
> contrato completo y vigente (841 operaciones reales) es
> [`openapi/openapi.yaml`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/openapi/openapi.yaml),
> navegable en `/reference` (Scalar) o
> `/docs` (Swagger UI) con el servidor local arriba. Ver
> [`docs/reports/openapi-generation-notes.md`](openapi-generation-notes.md). Se conserva aquí solo
> como registro de trazabilidad histórica.

# ALOVIDA Health API — Primeros 30 endpoints (Salud)

Contrato único de los 30 endpoints implementados. Alineado con Swagger (`/docs`),
los README por módulo y la colección Postman (`docs/postman/`). Selección por orden
numérico de archivo de casos de uso: **IAM (01)** + **Common (02)** + **Terminology
(03, primeros 7)**.

## Convenciones transversales

- **Auth**: JWT Bearer. Guard global; todo endpoint exige token salvo los marcados
  `@Public()` (login, refresh). Autorización por rol global con `@Roles(...)`
  (`SUPERADMIN` es comodín).
- **Errores**: cuerpo estable `{ code, message, correlationId, details?, timestamp,
  path }`. Códigos: `VALIDATION_FAILED`, `UNAUTHENTICATED`, `FORBIDDEN`,
  `NOT_FOUND`, `CONFLICT`, `PRECONDITION_FAILED`, `CONCURRENCY_CONFLICT`, `INTERNAL`.
- **Validación**: `ValidationPipe` global (`whitelist`, `forbidNonWhitelisted`,
  `transform`) → cierra mass-assignment.
- **Persistencia**: MikroORM 7 / PostgreSQL. Escrituras transaccionales; estados
  como conceptos (`terminology.catalog_concepts`, sembrados por el arranque).
- **Logs**: Pino estructurado; nunca secretos, tokens ni PHI.

## 01 — IAM

| UC | Método | Ruta | Rol | Cuerpo (resumen) | Éxito |
| --- | --- | --- | --- | --- | --- |
| 01-01 | POST | `/iam/users` | SECURITY_ADMIN | displayName, email, password, initialRole? | 201 |
| 01-02 | POST | `/iam/users/:id/credentials/federated` | SECURITY_ADMIN | identityProvider, externalSubject | 201 |
| 01-03 | POST | `/iam/users/:id/mfa-factors` | (auth) | factorType, label?, verify?, factorId? | 201 |
| 01-04 | POST | `/iam/auth/login` | público | email, password, mfaCode? | 200 |
| 01-05 | POST | `/iam/users/:id/devices` | (auth) | deviceFingerprint, platform?, trust? | 201 |
| 01-06 | POST | `/iam/auth/token/refresh` | público | refreshToken | 200 |
| 01-07 | POST | `/iam/users/:id/lock` | SECURITY_ADMIN | reason? | 200 |
| 01-08 | POST | `/iam/auth/logout-all` | (auth) | — | 200 |
| 01-09 | POST | `/iam/users/:id/credentials/:cid/revoke` | SECURITY_ADMIN | — | 200 |
| 01-10 | POST | `/iam/users/:id/global-roles` | SECURITY_ADMIN | role, action(GRANT/REVOKE) | 201/200 |
| 01-11 | POST | `/iam/auth/sessions/purge` | SECURITY_ADMIN | — | 200 |
| 01-12 | POST | `/iam/users/:id/anonymize` | SECURITY_ADMIN | — | 200 |

Reglas destacadas: unicidad de credencial de contraseña por `externalSubject`;
bloqueo automático tras N intentos fallidos (UC-01-07 se dispara desde login);
detección de reuso en refresh (revoca la sesión completa); anonimización DSAR
revoca credenciales, sesiones y roles. Cada operación escribe `iam.security_events`.

## 02 — Common

| UC | Método | Ruta | Rol | Cuerpo (resumen) | Éxito |
| --- | --- | --- | --- | --- | --- |
| 02-01 | POST | `/common/identifiers` | (auth) | ownerType, ownerId, type, system, value | 201 |
| 02-02 | POST | `/common/contact-points` | (auth) | ownerType, ownerId, system, value, use? | 201 |
| 02-03 | POST | `/common/contact-points/:id/verify` | (auth) | code? | 200 |
| 02-04 | POST | `/common/addresses` | (auth) | ownerType, ownerId, lines[], city?, country? | 201 |
| 02-05 | POST | `/common/files` | (auth) | originalName, category, sensitivity, mimeType, sizeBytes, contentHash, storageUri | 201 |
| 02-06 | POST | `/common/files/:id/versions` | (auth) | mimeType, sizeBytes, contentHash, storageUri | 201 |
| 02-07 | POST | `/common/files/:id/versions/:vid/derivatives` | (auth) | derivativeType, storageUri, ... | 201 |
| 02-08 | POST | `/common/files/:id/links` | (auth) | ownerType, ownerId, linkRole?, visibility? | 201 |
| 02-09 | POST | `/internal/files/versions/:vid/scan-result` | SECURITY_ADMIN | result(CLEAN/INFECTED) | 200 |
| 02-10 | DELETE | `/common/files/:id` | (auth) | — | 200 |
| 02-11 | POST | `/common/files/:id/download-url` | (auth) | — | 201 |

Reglas destacadas: unicidad de identificador oficial por `(system, value, type)`;
un archivo nace con versión 1 inmutable en estado de escaneo pendiente; los
derivados exigen versión origen `SCAN_CLEAN`; borrado lógico bloqueado bajo legal
hold; la URL firmada exige versión limpia.

## 03 — Terminology

| UC | Método | Ruta | Rol | Cuerpo (resumen) | Éxito |
| --- | --- | --- | --- | --- | --- |
| 03-01 | POST | `/terminology/code-systems` | SECURITY_ADMIN | internalCode, name, canonicalUrl, sourceCode | 201 |
| 03-02 | POST | `/terminology/code-systems/:id/versions` | SECURITY_ADMIN | version, isDefault? | 201 |
| 03-03 | POST | `/terminology/versions/:versionId/import` | SECURITY_ADMIN | concepts[] | 201 |
| 03-04 | POST | `/terminology/versions/:versionId/publish` | SECURITY_ADMIN | — | 200 |
| 03-05 | POST | `/terminology/concepts/:conceptId/designations` | SECURITY_ADMIN | value, language?, designationType? | 201 |
| 03-06 | POST | `/terminology/concepts/:conceptId/relationships` | SECURITY_ADMIN | targetConceptId, relationshipType | 201 |
| 03-07 | POST | `/terminology/value-sets` | SECURITY_ADMIN | internalCode, name, canonicalUrl, rules[]? | 201 |

Reglas destacadas: versión inmutable una vez publicada (import solo en `DRAFT`);
publicación es transición `DRAFT → ACTIVE`; relaciones rechazan auto-referencia y
duplicados; value set nace con su versión 1.0.0 y reglas de inclusión.

## Ejecución

```bash
# Migración/DDL: el arranque materializa el esquema (idempotente) y siembra conceptos
yarn start:dev

# Pruebas unitarias (mockeadas)
yarn test

# Pruebas de integración (Postgres local del .env, supertest)
yarn test:integration

# Cobertura
yarn test:cov
yarn test:integration:cov

# Swagger
# http://localhost:3000/docs
```
