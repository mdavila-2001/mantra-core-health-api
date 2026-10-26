# Public catalog module

Expone sin sesión los catálogos de servicios de organizaciones y de productos de
farmacias que tienen una ficha pública activa. Las consultas usan paginación por
cursor, límite de 50 y rate limit de 60 solicitudes por minuto.

Desde P37 también expone las **sucursales** de una farmacia (las sedes activas
de la farmacia verificada del tenant dueño de la ficha) y **qué sucursal tiene
lo de una receta escrita a mano**: `POST` con los renglones en el cuerpo —un
renglón de receta es un dato de salud y no viaja en la URL—, sólo stock
disponible, completas primero y después la más cercana en línea recta. No guarda
nada. Decisiones en el repositorio del frontend,
`mantra-core-health/docs/trabajo/2026-10-26-p37-sucursales-receta/`.

## Rutas HTTP y alcance (medido)

<!-- Medido el 2026-10-26 sobre wt/p37 (P37). Repetir con:
  find src/modules/public -name '*.controller.ts' | wc -l
  find src/modules/public -name '*.controller.ts' -exec grep -hE "^\s*@(Get|Post|Put|Patch|Delete)\(" {} + | wc -l
  find src/modules/public -name '*.entity.ts' | wc -l
  find src/modules/public -name '*.service.ts' | wc -l
La tabla sale de los decoradores `@Controller`/`@Get`/`@Post`/`@Put`/`@Patch`/`@Delete`, `@Roles` y `@Public`. -->

El módulo tiene **1 controller, 4 rutas HTTP, 0 entidades y 2 servicios**. La columna *Acceso* sale del código: `pública` = `@Public()`; un rol = `@Roles(...)`; `sesión` = sin ninguno de los dos, o sea que sólo exige sesión autenticada (guards globales `JwtAuthGuard`, `TenantScopeGuard`, `RolesGuard`, `VerifiedIdentityGuard`). La autorización por recurso puede vivir además en el servicio y no se refleja acá.

Si una tabla narrativa más abajo difiere de ésta (prefijo del controller omitido, sufijos `:accion` de la spec en lugar de sub-rutas), manda ésta: sale del código.

Su `*.module.ts` no declara `imports` de otros módulos.

| Método y ruta | Acceso | Controller |
| --- | --- | --- |
| `GET /public/profiles/o/:slug/services` | pública | `public-catalog` |
| `GET /public/profiles/f/:slug/products` | pública | `public-catalog` |
| `GET /public/profiles/f/:slug/branches` | pública | `public-catalog` |
| `POST /public/profiles/f/:slug/branch-availability` | pública | `public-catalog` |

## Verificación

```bash
corepack yarn test src/modules/public --runInBand --silent
```
