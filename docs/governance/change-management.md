# Gestión de cambios

> Fase 16.

## Cambios que requieren ADR

Ver la lista mínima en [ADR — cómo añadir uno nuevo](../adr/index.md): framework, ORM, motor de
datos, autenticación/autorización, multi-tenancy, eventos/colas, cache, almacenamiento de
archivos, observabilidad, versionado de API, estrategia de errores, idempotencia, despliegue,
secretos, migraciones, seeds, consistencia transaccional, patrón outbox. Un cambio a cualquiera de
estas áreas sin un ADR que lo acompañe dejaría la documentación de arquitectura desactualizada
respecto al código — exactamente lo que este plan de documentación existe para prevenir.

## Cambios incompatibles del contrato de API

Sin versionado de API activo ([ADR-0011](../adr/ADR-0011-sin-versionado-api.md)), un cambio
incompatible de contrato (renombrar un campo, cambiar un tipo, eliminar un endpoint) rompe a todo
consumidor existente inmediatamente al desplegarse — no hay periodo de transición posible con la
arquitectura actual. La detección de breaking changes en CI (ver
[proceso de revisión](review-process.md)) existe para hacer **visible** este riesgo antes del
merge, no para prevenirlo automáticamente.

## Cambios al modelo de datos

Todo cambio de esquema pasa por los `.puml` del modelo canónico → `SQL/` (ver [ADR-0021](../adr/ADR-0021-fuente-unica-de-ddl.md)) (ver
[migraciones](../data/migrations.md)) — sin rollback automático
([ADR-0016](../adr/ADR-0016-migraciones-sql-plano.md)), por lo que un cambio de esquema debe
evaluarse como potencialmente irreversible en producción hasta que se adopten migraciones
versionadas con `down` explícito.

## Cambios a permisos/roles

Ver [autorización](../api/authorization.md) y [actores y roles](../business/actors-and-roles.md)
— un rol nuevo o un cambio de alcance de `SUPERADMIN`/`break_glass_sessions` es de alto impacto
por definición (ver [modelo de amenazas](../security/threat-model.md)) y debe pasar por revisión
de seguridad, no solo revisión de código estándar.

## Ver también

- [Política de documentación](documentation-policy.md), [Proceso de revisión](review-process.md).
