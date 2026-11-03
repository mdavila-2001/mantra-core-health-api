# Propiedad (ownership)

> Estado real: **sin registro formal de propietarios técnicos por módulo o área**. Esta página
> documenta el estado, no lo inventa.

## `.github/CODEOWNERS` — placeholders, no equipos reales

Se creó `.github/CODEOWNERS` (Fase 16) con las áreas críticas identificadas por esta auditoría
(API/contrato, autorización/seguridad, datos/esquema, infraestructura), pero con marcadores
(`<equipo-...>`) en vez de equipos reales de GitHub — no existía un mapeo previo de
persona/equipo → área en el repositorio. **No tiene efecto real hasta que se reemplacen los
marcadores por usuarios o equipos de GitHub existentes.**

## `owner_team` — el campo que sí existe a nivel de dato

`system_ops.entity_registry.owner_team` (ver [clasificación](../data/classification.md)) es un
campo real en el modelo de gobernanza de datos — permite asignar propietario por tabla. Si está
poblado para las 1184 entidades es una pregunta de datos de cada base, igual que la
clasificación de sensibilidad.

## Roles de gobierno identificados (RBAC, no un mapeo de propiedad)

`MODULE_OWNER`, `DATA_STEWARD`, `DATA_PRODUCT_OWNER` existen como roles en el RBAC (ver
[actores y roles](../business/actors-and-roles.md)) — confirman que el concepto de "dueño de
módulo/dato" existe en el diseño del sistema, pero el RBAC no es un directorio de quién ocupa
esos roles hoy.
