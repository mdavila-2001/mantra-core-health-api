# Aislamiento de tenant

> Fase 13. Ver [ADR-0006](../adr/ADR-0006-multi-tenancy-rls.md) para la decisión completa. Esta
> página es el procedimiento de verificación operativa que ese ADR exige y que esta auditoría
> **no pudo ejecutar** por ser estática, no una prueba contra infraestructura real.

## El mecanismo (verificado en código)

1. `TenantContextInterceptor` (único interceptor global del sistema) valida `X-Tenant-Id` contra
   la membresía real del actor autenticado.
2. Con `RLS_ENFORCE=true`, fija `app.current_tenant_id` como variable de sesión de PostgreSQL.
3. Las políticas RLS de PostgreSQL (declaradas en el DDL, `database/SQL/99_migrations`) filtran
   filas por esa variable de sesión de forma transparente al ORM.

## Por qué esto no basta sin verificación operativa

RLS mal configurado falla **silenciosamente** — no hay excepción, solo fuga de datos. Dos
condiciones deben cumplirse simultáneamente en cada entorno real, y ninguna es verificable leyendo
el código:

1. `RLS_ENFORCE=true` efectivamente configurado (default `false` en `docker-compose.yml`).
2. El rol de aplicación en runtime (`DB_APP_USER`) **no** tiene el atributo `BYPASSRLS` de
   PostgreSQL — un rol con `BYPASSRLS`, o el propio rol propietario del esquema, ignora las
   políticas RLS por completo sin ningún error.

## Procedimiento de verificación (pendiente de ejecutar contra cada entorno)

Copiado de `ESTADO-Y-PENDIENTES.md` (ya identificado como prioridad P0 antes de esta auditoría):

1. Usar `DB_APP_USER`/`DB_APP_PASSWORD` (rol sin `BYPASSRLS`) para el runtime de la API y los
   workers — nunca el rol propietario del esquema.
2. Mantener el rol propietario solo para DDL, migraciones y seed.
3. Verificar que el tenant se fija dentro de la misma transacción/conexión que ejecuta la query
   de negocio (no en una conexión distinta del pool).
4. Ejecutar **pruebas negativas**: con dos tenants reales, intentar leer y mutar filas del tenant
   ajeno y confirmar que PostgreSQL las rechaza (0 filas, no un error que se pueda ignorar).

## Hallazgo importante: ya existe una prueba real que verifica exactamente esto

`test/integration/rls.int-spec.ts` — **no ejecutada en esta auditoría, pero revisada** — aplica la
migración real de RLS (`database/SQL/99_rls/01_tenant_rls.sql`, ~284 tablas con `tenant_id`) y
demuestra, conectado como el rol de aplicación real (`mantra_app`, sin `BYPASSRLS`):

1. El rol de aplicación **no** es superusuario ni tiene `BYPASSRLS` (verificado contra
   `pg_roles`).
2. Con `app.current_tenant_id` fijado, solo se ven las filas de ese tenant.
3. Insertar una fila de otro tenant se rechaza (`WITH CHECK`).
4. RLS quedó activado (`relrowsecurity` + `relforcerowsecurity`) en más de 200 tablas reales.

**Es opt-in por diseño, no por descuido**: `RLS_TEST=1 yarn test:integration` — porque aplica una
mutación de esquema irreversible (crea el rol `mantra_app`, fuerza RLS en ~284 tablas). No se
ejecutó en esta auditoría por esa misma razón: no es una decisión que un análisis documental deba
tomar por el equipo contra una base compartida sin autorización explícita.

## Hallazgo crítico dentro de la propia prueba: la política es permisiva sin GUC fijado

La prueba #3 (*"sin GUC fijado la política es permisiva"*) confirma un comportamiento real y
importante: **si una consulta llega a la base sin que `app.current_tenant_id` esté fijado, la
política RLS deja ver filas de todos los tenants** — no falla cerrado. Esto es coherente con
permitir contexto de sistema (migraciones, jobs administrativos), pero significa que
`TenantContextInterceptor` fijando el GUC en **cada** conexión de la API es la única barrera real
— un bug que abra una conexión sin pasar por el interceptor (p. ej. un script administrativo mal
escrito, una conexión directa fuera del flujo HTTP normal) vería todos los tenants sin ningún
error. RLS aquí es *aislamiento por configuración correcta*, no *aislamiento a prueba de fallos
por defecto*.

## Estado real de esta verificación

**El mecanismo está implementado y tiene una prueba real que lo demuestra.** Lo que esta
auditoría no verificó es: (a) que `RLS_TEST=1 yarn test:integration` se haya ejecutado y pasado
contra cada entorno real, y (b) que `RLS_ENFORCE=true` esté efectivamente activo en staging/
producción (el default en `docker-compose.yml` es `false`). Ver `SEC-001` en
[matriz de trazabilidad](../governance/traceability-matrix.md), clasificado `CRITICAL`, **abierto**
— reclasificado de "sin verificación posible" a "verificación disponible, pendiente de ejecutar
contra cada entorno real y confirmar `RLS_ENFORCE=true`".

**Esta sigue siendo la brecha de todo el Plan Maestro que no se cierra solo con documentación** —
cerrarla requiere ejecutar `RLS_TEST=1 yarn test:integration` deliberadamente contra cada entorno
(o una réplica fiel) y confirmar `RLS_ENFORCE=true` en producción. Ningún informe de esta
auditoría declara "apto para producción" sin esa verificación explícita (ver Fase 18).

## Ver también

- [ADR-0006: Multi-tenancy — RLS sobre esquema compartido](../adr/ADR-0006-multi-tenancy-rls.md)
- [Modelo de amenazas](threat-model.md)
