# Control de acceso

> Fase 13. Ver [autorización](../api/authorization.md) para el mecanismo completo (RBAC + PDP
> clínico aditivo) — esta página cubre lo que esa no: gobierno del propio control de acceso.

## Modelo

RBAC (120 roles, `authz.role_permissions`, `authz.user_role_assignments`) + PDP clínico aditivo
para PHI + enmascaramiento de campos (`authz.field_permissions`) + reglas de IP
(`authz.ip_access_rules`, allow/deny por CIDR) + identidades de máquina
(`authz.service_principals`, distintas de usuarios humanos).

## Separación humano / máquina

Los 20 workers y las integraciones externas usan credenciales de servicio
(`authz.service_principals`, `SYSTEM`/`SYSTEM_WORKER`/`AUTH_SERVICE`/`WRITE_SERVICE` como roles,
ver [actores y roles](../business/actors-and-roles.md) §"Sujetos de servicio-a-servicio") — no
comparten el mismo espacio de credenciales que un usuario humano.

## Revisión de accesos privilegiados

`SUPERADMIN` (bypass total de RBAC) y `break_glass_sessions` (acceso clínico de emergencia) son
los dos mecanismos de mayor privilegio del sistema. Ninguno de los dos tiene, verificado en esta
fase, un proceso de **revisión periódica de uso** documentado — es una brecha real, no una
omisión de esta página. Ver [modelo de amenazas](threat-model.md) §"Riesgos residuales".

## Mínimo privilegio en `api_keys`

`iam.api_keys` + `iam.api_key_scopes`: las claves de API se emiten con **scopes acotados**, no con
acceso total — coherente con la regla de diseño "superficie mínima" (ver
[modelo de amenazas](threat-model.md) §"Reglas de seguridad exigidas").

## Ver también

- [Autorización](../api/authorization.md)
- [Modelo de amenazas](threat-model.md)
