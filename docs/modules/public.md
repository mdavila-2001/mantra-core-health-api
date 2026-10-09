<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/public/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `public`

**Fuente:** [`src/modules/public/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/public/README.md)
· 1 controllers · 1 services · 1 repositories · 0 entidades · 1 DTO

---

# Public catalog module

Expone sin sesión los catálogos de servicios de organizaciones y de productos de
farmacias que tienen una ficha pública activa. Las consultas usan paginación por
cursor, límite de 50 y rate limit de 60 solicitudes por minuto.

## Rutas HTTP y alcance (medido)

<!-- Medido el 2026-10-08 sobre origin/dev (dae4fd68). Repetir con:
  find src/modules/public -name '*.controller.ts' | wc -l
  find src/modules/public -name '*.controller.ts' -exec grep -hE "^\s*@(Get|Post|Put|Patch|Delete)\(" {} + | wc -l
  find src/modules/public -name '*.entity.ts' | wc -l
  find src/modules/public -name '*.service.ts' | wc -l
La tabla sale de los decoradores `@Controller`/`@Get`/`@Post`/`@Put`/`@Patch`/`@Delete`, `@Roles` y `@Public`. -->

El módulo tiene **1 controller, 2 rutas HTTP, 0 entidades y 1 servicio**. La columna *Acceso* sale del código: `pública` = `@Public()`; un rol = `@Roles(...)`; `sesión` = sin ninguno de los dos, o sea que sólo exige sesión autenticada (guards globales `JwtAuthGuard`, `TenantScopeGuard`, `RolesGuard`, `VerifiedIdentityGuard`). La autorización por recurso puede vivir además en el servicio y no se refleja acá.

Si una tabla narrativa más abajo difiere de ésta (prefijo del controller omitido, sufijos `:accion` de la spec en lugar de sub-rutas), manda ésta: sale del código.

Su `*.module.ts` no declara `imports` de otros módulos.

| Método y ruta | Acceso | Controller |
| --- | --- | --- |
| `GET /public/profiles/o/:slug/services` | pública | `public-catalog` |
| `GET /public/profiles/f/:slug/products` | pública | `public-catalog` |

## Verificación

```bash
corepack yarn test src/modules/public --runInBand --silent
```

La auditoría de octubre de 2026 está en
[`docs/revision-backend-2026-10-04/modulos/public.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/docs/revision-backend-2026-10-04/modulos/public.md).
