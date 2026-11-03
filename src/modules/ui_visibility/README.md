# Módulo `ui_visibility` — Visibilidad de la interfaz

Catálogo de elementos de la interfaz y reglas SHOW/HIDE por sujeto. Contrato:
`mantra-core-health/docs/trabajo/2026-10-31-visibilidad-rbac/CONTRATO.md`.

> **La visibilidad NO es autorización.** Ocultar un elemento no protege nada: la API autoriza cada
> petición (RBAC/PDP). Este módulo decide qué se *presenta*; nunca concede acceso.

| Ruta | Acceso | Qué hace |
| --- | --- | --- |
| `GET /admin/ui-visibility/elements` | `SECURITY_ADMIN` (`SUPERADMIN` por comodín) | Catálogo; cursor `(key, id)` |
| `POST /admin/ui-visibility/elements` | ídem | Alta manual (source `ADMIN`) |
| `POST /admin/ui-visibility/elements/sync` | ídem | Sincroniza el registro del front; idempotente por `key`; retira los `CODE` ausentes; lote vacío = 422 |
| `GET /admin/ui-visibility/rules` | ídem | Reglas; cursor `(createdAt desc, id desc)` |
| `POST /admin/ui-visibility/rules` | ídem | Crea una regla (201) |
| `PATCH /admin/ui-visibility/rules/:id` | ídem | Edita con `If-Match: <version>` (409 si cambió) |
| `POST /admin/ui-visibility/rules/:id/end` | ídem | Termina la regla (`validTo` = ahora); idempotente |
| `GET /admin/ui-visibility/preview?userId=\|roleCode=` | ídem | «Ver como»: lo oculto y la regla ganadora |
| `GET /me/ui-visibility` | cualquier usuario autenticado | `{ hiddenKeys, version, generatedAt }` de quien llama |

Resolución (`resolver/ui-visibility.resolver.ts`, función pura): reglas en vigor que aplican al sujeto →
`USER > TENANT > ROLE > ORG_TYPE > ALL` → en empate gana `HIDE` → sin regla, `defaultVisible` → un
ancestro oculto oculta a sus descendientes.

## Alcance (organización)

- `SUPERADMIN` de plataforma ve y toca todo.
- Un `SECURITY_ADMIN` de organización sólo ve/toca las reglas acotadas a su organización
  (`scope_tenant_id`), y sólo puede crear `TENANT` sobre su organización o `USER` sobre miembros de ella.
  Una regla ajena responde el mismo 404 `UI_RULE_NOT_FOUND` que una inexistente.
- Una regla acotada sólo aplica cuando la persona actúa en esa organización.

## Piezas

- Tablas (modelo, módulo 06): `authz.ui_visibility_elements`, `authz.ui_visibility_rules`.
- `repositories/ui-visibility.store.ts` — puerto; `mikro-orm-ui-visibility.store.ts` — implementación.
- `testing/in-memory-ui-visibility.store.ts` — **doble** de pruebas, no es el colaborador real.

## Esquema

Las dos tablas se declaran en el modelo (`mantra-core-health-model`, `diagram_06_authz.puml`; CHECK en
`diagram_33_integrity.puml`) y se aplican con `SQL/patches/2026-10-31_ui_visibility.sql` sobre una base viva, o
con `apply_all.sql` en un rebuild. Los vocabularios cerrados son CHECK, no conceptos: el módulo no siembra nada
en `terminology.catalog_concepts`.
