# ADR-0006: Multi-tenancy — esquema compartido con Row-Level Security

## Estado
Aceptado.

## Contexto
La plataforma sirve a múltiples organizaciones de salud sobre la misma base de datos. El modelo
de aislamiento debe impedir que el actor de un tenant lea o escriba filas de otro, sin duplicar
esquema por cliente.

## Fuerzas y restricciones
- Esquema compartido (no un schema/base por tenant) simplifica migraciones y operación.
- PostgreSQL RLS aplica el aislamiento a nivel de fila, transparente a las queries del ORM.
- El aislamiento debe sostenerse aunque una query tenga un bug — no puede depender solo de que
  el desarrollador recuerde filtrar por tenant en cada repositorio.

## Opciones consideradas
Base/schema por tenant vs. esquema compartido + RLS: el código implementa esquema compartido +
RLS (`RLS_ENFORCE`, `TenantContextInterceptor` fija `app.current_tenant_id`).

## Decisión
Multi-tenancy por Row-Level Security sobre esquema compartido. `TenantContextInterceptor` valida
`X-Tenant-Id` contra la membresía real del actor y fija la variable de sesión que las políticas
RLS de PostgreSQL usan para filtrar filas.

## Consecuencias positivas
- El aislamiento se aplica en la capa de base de datos, no solo en el código de aplicación —
  defensa en profundidad ante un bug de filtrado en un repositorio.
- Un solo esquema que migrar y operar para todos los tenants.

## Consecuencias negativas
- RLS mal configurado (política ausente en una tabla nueva, o rol de aplicación con
  `BYPASSRLS`) falla de forma silenciosa: no hay error, solo fuga de datos.
- Requiere disciplina operativa: el rol de runtime (`DB_APP_USER`) debe ser distinto del rol
  propietario usado para DDL/migraciones.

## Riesgos
**Crítico.** `RLS_ENFORCE` es configurable por entorno y su valor real en cada despliegue no
está verificado por este repositorio. Este ADR no afirma que el aislamiento esté activo en un
despliegue concreto; [`docs/security/tenant-isolation.md`](../security/tenant-isolation.md)
describe cómo comprobarlo.

## Evidencia
`src/common/tenant/tenant-context.interceptor.ts`, `docker-compose.yml` (`RLS_ENFORCE`),
[`docs/security/tenant-isolation.md`](../security/tenant-isolation.md).

