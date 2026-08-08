# Aislamiento de tenant

> Fase 13. Ver [ADR-0006](../adr/ADR-0006-multi-tenancy-rls.md) para la decisión completa. Esta
> página es el procedimiento de verificación operativa que ese ADR exige. La
> prueba se ejecutó contra la base local desechable; cada ambiente real continúa
> necesitando su propia evidencia.

## El mecanismo (verificado en código)

1. `TenantContextInterceptor` (único interceptor global del sistema) valida `X-Tenant-Id` contra
   la membresía real del actor autenticado.
2. Con `RLS_ENFORCE=true`, fija `app.current_tenant_id` como variable de sesión de PostgreSQL.
3. Las políticas RLS de PostgreSQL (declaradas en el DDL, los `.puml` del modelo canónico → `SQL/` (ver [ADR-0021](../adr/ADR-0021-fuente-unica-de-ddl.md))) filtran
   filas por esa variable de sesión de forma transparente al ORM.
4. Solo una llamada interna autenticada con el rol no asignable `SYSTEM` puede activar
   `app.system_context=true`; el interceptor lo hace de forma local a la misma transacción y las
   políticas lo interpretan como elevación cross-tenant explícita.

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

## Prueba real del mecanismo

`test/integration/rls.int-spec.ts` aplica la
migración real de RLS (`SQL/patches/2026-08-05_tenant_rls.sql`, ~284 tablas con `tenant_id`) y
demuestra, conectado como el rol de aplicación real (`mantra_app`, sin `BYPASSRLS`):

1. El rol de aplicación **no** es superusuario ni tiene `BYPASSRLS` (verificado contra
   `pg_roles`).
2. Con `app.current_tenant_id` fijado, solo se ven las filas de ese tenant.
3. Insertar una fila de otro tenant se rechaza (`WITH CHECK`).
4. Sin GUC no se ve ninguna fila: la política falla cerrada.
5. Con `app.system_context=true`, una operación interna `SYSTEM` puede recorrer todos los tenants
   de manera explícita sin otorgar `BYPASSRLS` al rol de aplicación.
6. RLS quedó activado (`relrowsecurity` + `relforcerowsecurity`) en más de 200 tablas reales.

**Es opt-in por diseño, no por descuido**: use credenciales reales mediante
`DB_APP_USER`/`DB_APP_PASSWORD`, o, exclusivamente para una base local
desechable, ejecute
`RLS_TEST=1 RLS_TEST_BOOTSTRAP_LOCAL_ROLE=1 yarn test:integration`. La prueba
revoca `LOGIN` del rol local al terminar. Es opt-in porque aplica una
mutación de esquema irreversible (crea el rol `mantra_app`, fuerza RLS en ~284 tablas). No se
debe apuntar a una base compartida sin autorización explícita.

## Comportamiento fail-closed

La política compara `tenant_id` contra
`NULLIF(current_setting('app.current_tenant_id', true), '')::uuid`. Cuando el
GUC falta o está vacío, la expresión no autoriza ninguna fila ni ningún insert.
Los procesos administrativos cross-tenant usan un token interno firmado con el
rol no asignable `SYSTEM`; el interceptor fija `app.system_context=true` solo
dentro de la transacción de esa llamada. Una llamada `SYSTEM` dirigida a un
tenant concreto vuelve a fijar `app.system_context=false` y
`app.current_tenant_id`, por lo que permanece aislada. `mantra_app` nunca obtiene
`BYPASSRLS` ni un bypass implícito. El SQL versionado crea el rol como `NOLOGIN`
si no existe y no contiene contraseñas conocidas: IaC habilita `LOGIN` con un
secreto del ambiente.

## Estado real de esta verificación

**El mecanismo está implementado y pasó 6/6 pruebas en la base local
desechable.** Lo que esta auditoría no verificó es: (a) que la misma prueba pase
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
