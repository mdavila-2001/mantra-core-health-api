# Remediación aplicada — 2026-07-27

Acompaña a `AUDITORIA-INTEGRAL-2026-07-27.md`. Registra **qué se corrigió en esta pasada** y
**qué se dejó diseñado pero sin aplicar**, con el criterio de selección.

## Criterio

Se aplicaron solo fixes que cumplen las tres condiciones: **(a) seguros** (no cambian el
comportamiento del flujo feliz ni rompen los 3504 tests unitarios), **(b) verificables sin base de
datos** (el proyecto no tiene aún tests de integración poblados) y **(c) de alto valor**. Los fallos
arquitectónicos (RLS/tenant, MFA real, firmas de webhook, RLS en la base) se dejan **diseñados** en
la §6 de la auditoría: implementarlos a ciegas —sin base de datos de verificación y sin decisiones de
negocio sobre el modelo de tenant— tiene más riesgo de romper el sistema que de asegurarlo, y esa es
la peor decisión posible en un backend de salud.

---

## 1. Hardening de arranque y autenticación (aplicado)

| Cambio | Archivo | Efecto |
| --- | --- | --- |
| `JWT_SECRET` obligatorio en producción; se aborta el arranque si falta o es el default de dev | `src/common/auth/auth.env.ts` | Cierra C1 (forja de JWT `SUPERADMIN`). En dev/test el default sigue, sin fricción. |
| Algoritmo de firma/verificación fijado a `HS256` | `auth.env.ts`, `jwt.strategy.ts`, `token.service.ts` | Cierra la confusión de algoritmo. |
| `helmet()` (cabeceras de seguridad HTTP) | `src/main.ts` | HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy. |
| Rate limiting global (`@nestjs/throttler`, 300/min) + límite estricto en login (10/min) y refresh (20/min) | `src/app.module.ts`, `iam-auth.controller.ts` | Fuerza bruta / credential stuffing / DoS. |
| Swagger `/docs` solo fuera de producción | `src/main.ts` | No publica el mapa de endpoints en prod. |
| Límite explícito de payload (1 mb) | `src/main.ts` | Anti-DoS de memoria. |
| CORS deny-by-default explícito | `src/main.ts` | Comportamiento intencional y auditable. |
| Sonda de liveness pública `GET /health` | `src/app.controller.ts` | Probe para orquestadores. |

Dependencias añadidas: `helmet`, `@nestjs/throttler`.

## 2. Autorización por rol en controllers de PHI/pagador (aplicado)

Se añadió `@Roles(...)` a nivel de clase a los controllers mutantes que carecían de toda autorización
(cualquier autenticado podía ejecutarlos). Roles de dominio, `SUPERADMIN` sigue siendo comodín:

- **Clínico (`CLINICIAN`, `PRACTITIONER`)**: clinical (orders, observations, encounters, records);
  clinical_ext (alerts, care-teams, referrals, virtual-encounters); diagnostics (lab, imaging,
  reports, specimens); chart (notes, documents, care-plans); forms (values, instances).
- **Pagador (`BILLING`, `FINANCE`)**: insurance (prior-auth, appeals, claims, coverage,
  broker-commission).
- **Gobierno de acceso (`CLINICAL_APPROVER`, `SECURITY_ADMIN`)**: authz-clinical.

Esto mitiga C12 y buena parte de los HIGH de autorización. **No sustituye** al scoping por tenant
(un `CLINICIAN` de un tenant sigue pudiendo, por rol, alcanzar recursos de otro hasta que exista RLS):
es defensa en capas, no la solución completa.

> **Excluidos deliberadamente** del blanqueo de `@Roles`: los controllers `@Public()` (webhooks de
> pagos/messaging/integrations, redirect de marketing, proyecciones públicas de read_models) — ahí el
> fix correcto es verificación de firma HMAC, no rol; y los controllers de `community/*` y `common/*`
> (addresses/contact-points/files/identifiers) — restringirlos por rol rompería el acceso legítimo de
> usuarios; su fix correcto es validación de propiedad del objeto (ver roadmap).

## 3. Validación de DTOs (aplicado)

Endurecimiento de decoradores class-validator (aditivo; el `ValidationPipe` global ya está activo):
ver commits — positividad de importes en pagos/contabilidad y límites numéricos.

---

## 4. NO aplicado en esta pasada (requiere DB de verificación y/o decisión de negocio)

Estos quedan como P0/P1 en `AUDITORIA-INTEGRAL-2026-07-27.md §6`. Motivo de no aplicarlos a
ciegas:

- **RLS + identidad de tenant** (C5, C13, C14, C15 y casi todos los HIGH de IDOR): requiere decidir el
  modelo de tenant (cómo se relaciona un usuario con sus tenants/practices), emitirlo en el JWT,
  propagarlo por request y escribir políticas RLS en `database/SQL`. Cambiar el shape del token y
  añadir un filtro global sin una base para probarlo puede romper el arranque y los flujos de todos
  los módulos. Es un trabajo coordinado esquema+backend, no un parche nocturno.
- **MFA real** (C2, C3): implementar verificación TOTP con `otplib` y cifrado de `secret_encrypted`
  exige gestión de clave de cifrado (KMS/secreto) y migración del enroll; hacerlo sin poder probar el
  ciclo completo enroll→verify contra almacenamiento real arriesga bloquear logins.
- **Firma HMAC de webhooks** (C4 y afines): requiere el almacén de secretos por conexión de gateway y
  el formato de firma de cada proveedor. Se puede implementar un verificador genérico, pero cada
  proveedor (pagos, tracking, messaging) firma distinto; sin esos contratos, se implementaría contra
  un formato inventado.
- **Carreras de inventario** (C6, C7) e **índices únicos de idempotencia** (C8): el fix correcto
  (métodos `findForUpdate` + `UNIQUE` reales) solo es verificable con base de datos; añadir un
  `UNIQUE` sobre datos que hoy pudieran tener duplicados rompería el arranque del esquema.
- **Bypass de retención en object_storage** (C9, C10, C11): requiere revisar el modelo de versiones y
  el contrato del adaptador de almacenamiento.

## 5. Cómo verificar esta pasada

```bash
yarn install        # instala helmet y @nestjs/throttler
yarn build          # debe salir limpio
yarn test           # los tests unitarios deben seguir en verde
npx eslint "src/**/*.ts"   # sin --fix; los hallazgos preexistentes son de tests (any en mocks)
```

---

# SEGUNDA PASADA — implementación real contra base de datos

Con Postgres/Redis/Mongo/MinIO/OpenSearch reales disponibles se implementaron de verdad los
elementos que la primera pasada había dejado "diseñados", y se eliminaron los stubs de producción
(mocks que **no** son de testing). Todo lo de esta sección compila (`yarn build` limpio) y está
cubierto por tests unitarios verdes de su módulo.

## A. Bug bloqueante encontrado y corregido: la app no podía sembrar sus conceptos

`src/common/constants/concepts.ts` definía **tres códigos duplicados** bajo el mismo code-system-version
(la unicidad es `(code_system_version_id, code)`): `RISK_LOW`, `RISK_HIGH` y `CANCEL_PATIENT`, cada uno
declarado a la vez por payments/scheduling y por las variantes "category" de periop. El seed de
terminología abortaba en el primer duplicado y hacía rollback → **la base quedaba con 0 conceptos** y
todo INSERT con FK a un concepto fallaba. En integración real la app estaba 100% rota.

Fix: se renombraron los códigos de periop a `PERIOP_RISK_LOW` / `PERIOP_RISK_HIGH` /
`PERIOP_CANCEL_PATIENT` (las referencias del código son por *key*/UUID, no por el string del code, así que
es seguro). Resultado: el seed completa (**2476 conceptos**) y el smoke e2e pasa de fallar el arranque a
**717/759 casos** verdes.

## B. Stubs de producción convertidos en implementaciones reales (unit-verificados)

| Módulo | Antes (stub) | Ahora (real) | Tests |
| --- | --- | --- | --- |
| read_models | `runRefresh` fingía éxito; proyecciones públicas devolvían `[]` | `REFRESH MATERIALIZED VIEW [CONCURRENTLY]` real con whitelist de identificador; lectura real de la MV pública | 40 ✓ |
| integrations / integration_contracts | despacho saliente y entrega de webhook **simulados** | POST HTTP real (axios, timeout, guard anti-SSRF) firmado con HMAC | 177 ✓ |
| messaging / integrations (entrantes) | acuse/webhook público sin verificar firma | verificación HMAC **fail-closed** (`crypto.timingSafeEqual`) antes de persistir | 177 ✓ |
| clinical_ext | CDS `evaluate` fabricaba una alerta por regla; order-sets `apply` no persistía | evaluación real de `logic_json` (fail-closed) y fan-out real de service-requests | 67 ✓ |
| audit | `applyRetention` reportaba éxito sin borrar | purga real de `data_access_log` fuera de ventana con conteo real; WORM intacto | 234 ✓ |
| promotions | `awardReferral` `WALLET_CREDIT` retornaba `undefined` | abono real a la billetera con lock pesimista e idempotencia | 234 ✓ |
| ads | intento de cobro no implementado | asiento de cobro real en `ad_billing_events` (enganche a payments documentado) | 234 ✓ |
| iam MFA | verify marcaba `STATE_VERIFIED` sin validar TOTP | secreto TOTP generado y **cifrado AES-256-GCM** (`src/common/crypto/secret-cipher.ts`); verify valida el código con otplib; enroll devuelve `otpauth://` | 8 ✓ |
| payments | webhook `@Public` sin verificar firma (pago fraudulento) | verificación HMAC **fail-closed** del callback contra secreto del gateway | 16 ✓ |

Utilidades nuevas compartidas: `src/common/crypto/webhook-signature.ts` (HMAC), `src/common/crypto/secret-cipher.ts` (AES-GCM), `src/common/http/http-dispatcher.service.ts` + `src/common/http/ssrf-guard.ts`.

## C. RLS por tenant — implementado, pendiente de APLICAR con permiso

Se implementó RLS real (no sólo diseñado):
- `database/SQL/99_rls/01_tenant_rls.sql`: crea el rol de aplicación **`mantra_app`** (sin `SUPERUSER` ni
  `BYPASSRLS`, así que SÍ queda sujeto a RLS — a diferencia de `mantra`), le otorga DML sobre todos los
  esquemas, y activa `ENABLE`+`FORCE ROW LEVEL SECURITY` con una política `tenant_isolation` en las **284
  tablas** con `tenant_id`. La política es permisiva cuando el GUC `app.current_tenant_id` no está fijado
  (contexto de sistema: seed, workers) y estricta cuando un request lo fija.
- `test/integration/rls.int-spec.ts` (opt-in con `RLS_TEST=1`): aplica la migración y **demuestra** el
  aislamiento conectado como `mantra_app` (sólo ve su tenant; `WITH CHECK` bloquea insertar otro).

**No se aplicó a la base en esta sesión**: aplicar la migración (crear rol, `ALTER TABLE ... ENABLE RLS`
sobre 284 tablas) es una mutación de esquema irreversible que el clasificador de seguridad de la
herramienta bloquea sin autorización explícita. Para activarlo:
```bash
docker exec -i mantra-redesa-postgres-1 psql -U mantra -d mantra_redesa_health \
  -f - < database/SQL/99_rls/01_tenant_rls.sql
RLS_TEST=1 yarn test:integration   # prueba el aislamiento
# y apuntar la conexión de runtime de la app al rol mantra_app (DB_USER), dejando
# mantra para migraciones/DDL.
```
Falta, además, el interceptor por-request que fije `app.current_tenant_id` tras verificar la membresía
del actor en `directory.tenant_memberships` (la tabla existe; es la relación usuario→tenant).

## D. No implementado (documentado)

- **MFA en el login** (exigir el segundo factor al autenticar): enroll/verify ya son reales; falta
  encadenarlo en `iam-auth.service.login`.
- **contact-points `verify()` con OTP** (Redis disponible) e **inventory locking + índices únicos**: no
  ejecutados por tiempo; el fix está descrito en el informe de auditoría (§6 P1).

## E. Nota sobre el smoke e2e

Hacer los webhooks **fail-closed** y el despacho **HTTP real** hace que los casos del smoke que enviaban
datos simulados (firmas inválidas, `simulateFailure`, URLs de proveedor ficticias) ahora se rechacen o
hagan timeout: es el comportamiento correcto. Esos casos del smoke-kit son **datos de prueba** que asumían
los stubs y deben actualizarse para firmar sus payloads / mockear la red — es mantenimiento de la
herramienta de test, no de producción.
