# Modelo de amenazas (STRIDE)

> Fase 13. Metodología STRIDE, verificada tabla por tabla contra el código real de este
> repositorio. Fuente base: documento de arquitectura interno del proyecto ("Modelo de amenazas y
> matriz de controles — STRIDE"), contrastado y ampliado con hallazgos propios de esta auditoría
> (`docs/reports/`, `docs/governance/traceability-matrix.md`).

## Activos críticos

1. **PHI** (historia clínica, diagnósticos, medicación) — el activo de mayor sensibilidad.
2. **Credenciales y tokens** (JWT, API keys, secretos de MFA).
3. **Datos financieros** (facturación, pagos, contabilidad).
4. **Integridad del RBAC/PDP** — comprometer `SUPERADMIN` o el PDP clínico compromete todo lo demás.
5. **Disponibilidad de la API y los 20 workers** — un sistema de salud con downtime tiene impacto
   clínico real, no solo de negocio.

## Fronteras de confianza

Ver [contexto del sistema](../architecture/system-context.md) y
[mapa de integraciones](../architecture/integration-map.md) §4. La única superficie de entrada
externa autenticada es la API (`api`); los 20 workers solo salen hacia `api`, nunca reciben
tráfico entrante.

## Matriz STRIDE → control → evidencia real

| Amenaza | Ejemplo en este dominio | Control (tablas/mecanismos reales) | Evidencia verificada |
|---|---|---|---|
| **S**poofing (suplantación) | Alguien se hace pasar por un profesional clínico | Credenciales hasheadas, MFA (`iam.mfa_factors`), API keys (`iam.api_keys`), `identity_assurance`, reglas de IP (`authz.ip_access_rules`) | Entidades confirmadas en [catálogo de entidades](../data/entity-catalog.md) |
| **T**ampering (alteración) | Modificar un resultado de laboratorio ya registrado | Tablas `*_history` (versionado), `row_version` (bloqueo optimista, 353 usos de `PreconditionFailedException`), `audit.audit_log` WORM | [ADR-0002](../adr/ADR-0002-orm-mikroorm.md), [graphify-audit.md](../reports/graphify-audit.md) §7 |
| **R**epudiation (negación) | "Yo no accedí a esa historia clínica" | `audit.data_access_log`, `authz.break_glass_sessions` (con justificación obligatoria) | Entidades confirmadas en código |
| **I**nformation disclosure (fuga de PHI) | Exponer PHI a un actor sin autorización | Cifrado + `system_ops.encryption_keys`, `authz.field_permissions` (enmascaramiento), RLS por `tenant_id`, `system_ops.data_classifications` | [autorización](../api/authorization.md), [ADR-0006](../adr/ADR-0006-multi-tenancy-rls.md) — **RLS con verificación operativa pendiente, ver `SEC-001`** |
| **D**enial of service | Saturar el login o la API | `ThrottlerGuard` global (reconciliado — ver [arquitectura de seguridad](security-architecture.md) §"Discrepancia"), `iam.account_lockouts` | `src/app.module.ts` (`APP_GUARD` → `ThrottlerGuard`) |
| **E**levation of privilege | Un usuario obtiene privilegios de `SUPERADMIN` | RBAC (`authz.role_permissions`), `authz.resource_scope_grants`, `authz.service_principals`, revisión de break-glass | [ADR-0005](../adr/ADR-0005-autorizacion-rbac-pdp-clinico.md) |

## Reglas de seguridad exigidas a toda tabla nueva (estándar de diseño del proyecto)

1. Secretos jamás en claro: contraseñas → `*_hash`; claves API → `key_hash`; material
   criptográfico → solo `external_key_ref` al KMS/HSM.
2. PHI/PII cifrada en reposo con llave de `system_ops.encryption_keys` y rotación
   (`next_rotation_at`).
3. Aislamiento por tenant (`tenant_id` + RLS) en todo dato de negocio.
4. Toda lectura de datos sensibles deja traza en `data_access_log`; todo cambio relevante, en
   `audit_log`.
5. Acceso de emergencia solo vía `break_glass_sessions` (justificación obligatoria + expiración +
   revisión posterior).
6. Superficie mínima: exponer una API implica `api_keys` con scopes acotados, rate-limit y,
   si aplica, restricción por IP.
7. Todo evento de seguridad se registra en `system_ops.security_incidents`; si afecta datos
   personales, dispara `system_ops.breach_notifications` dentro del plazo legal (GDPR 72h /
   HIPAA 60d).
8. Mínimo privilegio y separación de deberes: quien ejecuta una acción sensible no debe ser quien
   la revisa.

## Riesgos residuales — no cerrados por esta documentación

| Riesgo | Amenaza STRIDE | Probabilidad | Impacto | Mitigación actual | Riesgo residual |
|---|---|---|---|---|---|
| `RLS_ENFORCE` no verificado por entorno (`SEC-001`) | Information disclosure | Media (depende de configuración operativa) | **Crítico** — fuga cross-tenant de PHI | RLS implementado en código; verificación operativa pendiente | **Abierto** — no se declara mitigado sin verificación real contra cada entorno |
| `SUPERADMIN` como bypass total de RBAC | Elevation of privilege | Baja (requiere comprometer una cuenta específica) | Crítico — bypass completo | Ninguna mitigación adicional identificada (sin aprobación dual, sin alerta especial de uso) | **Abierto** — candidato a mecanismo de aprobación dual o alerta de uso |
| Población real de `entity_registry`/clasificación no verificada (`GOV-005`) | Information disclosure | — | Alto si hay tablas con PHI sin marcar | Mecanismo de gobernanza implementado en código | **Abierto** — requiere auditoría contra base real |
| Cobertura de `data_access_log` sobre toda lectura de PHI | Repudiation / Information disclosure | — | Alto | Mecanismo existe; cobertura real no verificada (recomendación explícita del propio estándar de diseño del proyecto: "verificar por `entity_registry.contains_phi`") | **Abierto** |
| 16 vulnerabilidades `high` en dependencias de desarrollo (`SEC-003`) | Denial of service (vía herramientas de build/test) | Baja — sin ruta de alcance a producción | Bajo | Ninguna — sin ruta de explotación en runtime de producción | **Aceptado**, ver `docs/reports/baseline.md` §3.3 |

## Por qué el break-glass importa (ejemplo real del propio diseño)

Sin `break_glass_sessions`, cuando un paciente llega inconsciente a urgencias, el médico o **no
puede** ver su historia (riesgo clínico) o la ve saltándose el control **sin dejar rastro** (riesgo
legal). Con la tabla, ve la historia **y** queda la justificación obligatoria para revisión
posterior — se resuelve la urgencia sin renunciar a la auditoría.

## Ver también

- [Arquitectura de seguridad](security-architecture.md)
- [Control de acceso](access-control.md)
- [Aislamiento de tenant](tenant-isolation.md)
- [Auditabilidad](auditability.md)
- [Gestión de secretos](secrets-management.md)
