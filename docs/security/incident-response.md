# Respuesta a incidentes

> Fase 13. Mecanismo de registro real; procedimientos operativos completos (guardias, escalamiento)
> se documentan en runbooks (Fase 14) — esta página cubre lo que es responsabilidad de seguridad,
> no de operación general.

## Registro de incidentes de seguridad

`system_ops.security_incidents` — distinto de los incidentes operativos de `platform_ops` (cita
del estándar de diseño del proyecto: *"los incidentes de `platform_ops` son operativos, no de
seguridad"*). Un incidente de seguridad (acceso no autorizado sospechoso, fuga potencial, abuso de
`break_glass`) tiene su propio registro, no se mezcla con caídas de infraestructura.

## Notificación de brecha — plazo legal

`system_ops.breach_notifications` — si un incidente de seguridad afecta datos personales, dispara
notificación dentro del plazo legal: **GDPR 72 horas**, **HIPAA 60 días**. El mecanismo de
registro existe en código; el proceso operativo real de quién decide activar una notificación y
cómo se ejecuta dentro de esos plazos **no está documentado en esta fase** — es una brecha real,
no una omisión de esta página.

## Actores responsables

`INCIDENT_COMMANDER`, `COMPLIANCE_OFFICER`, `SECURITY_ADMIN`, `PRIVACY_OFFICER`/`DPO` (ver
[actores y roles](../business/actors-and-roles.md)) — roles que existen en el RBAC, sin un
runbook formal de "quién hace qué en las primeras 24 horas" verificado en esta fase.

## Alcance de este documento

Describe el mecanismo de *registro* de incidentes, no el *procedimiento* de respuesta: el
procedimiento operativo está en el [manual de incidentes](../resilience/07-manual-de-incidentes.md),
con roles y niveles de severidad en [recuperación y continuidad](../resilience/05-recuperacion-y-continuidad.md).
No hay un simulacro documentado.

## Ver también

- [Modelo de amenazas](threat-model.md)
- [Auditabilidad](auditability.md)
