<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/content_packs/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver docs/progress/ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `content_packs`

**Fuente:** [`src/modules/content_packs/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/content_packs/README.md)
· 1 controllers · 1 services · 0 repositories · 0 entidades · 1 DTO

---

# Módulo Content Packs — Contenido curado aplicable a demanda

Superficie de plataforma para aplicar **paquetes de contenido**: material curado
que una instalación puede querer o no, y que antes se sembraba solo en cada
arranque. Es la contracara de `SEED_CONTENT_ON_BOOT`: lo que el arranque dejó de
sembrar por su cuenta se aplica desde acá cuando alguien lo decide.

## Rutas HTTP y alcance (medido)

<!-- Medido el 2026-10-08 sobre origin/dev (dae4fd68). Repetir con:
  find src/modules/content_packs -name '*.controller.ts' | wc -l
  find src/modules/content_packs -name '*.controller.ts' -exec grep -hE "^\s*@(Get|Post|Put|Patch|Delete)\(" {} + | wc -l
  find src/modules/content_packs -name '*.entity.ts' | wc -l
  find src/modules/content_packs -name '*.service.ts' | wc -l
La tabla sale de los decoradores `@Controller`/`@Get`/`@Post`/`@Put`/`@Patch`/`@Delete`, `@Roles` y `@Public`. -->

El módulo tiene **1 controller, 2 rutas HTTP, 0 entidades y 1 servicio**. La columna *Acceso* sale del código: `pública` = `@Public()`; un rol = `@Roles(...)`; `sesión` = sin ninguno de los dos, o sea que sólo exige sesión autenticada (guards globales `JwtAuthGuard`, `TenantScopeGuard`, `RolesGuard`, `VerifiedIdentityGuard`). La autorización por recurso puede vivir además en el servicio y no se refleja acá.

Si una tabla narrativa más abajo difiere de ésta (prefijo del controller omitido, sufijos `:accion` de la spec en lugar de sub-rutas), manda ésta: sale del código.

Importa (`SeedModule`).

| Método y ruta | Acceso | Controller |
| --- | --- | --- |
| `GET /admin/content-packs` | SUPERADMIN | `content-packs` |
| `POST /admin/content-packs/:code/apply` | SUPERADMIN | `content-packs` |

## Qué es y qué no es un paquete

Un paquete es contenido opcional: el glosario médico, los establecimientos y las
aseguradoras de Bolivia, el nomenclador de procedimientos, el vademécum, los
formularios clínicos y las cuentas de demostración.

El **núcleo** no es un paquete. El catálogo de conceptos, las enumeraciones
dinámicas, los canales de mensajería y los roles son necesarios para que la base
acepte una escritura, así que los siembra el arranque siempre
(`seed-boot.env.ts`).

## Endpoints

| Método | Ruta | Rol | Qué hace |
|---|---|---|---|
| `GET` | `/admin/content-packs` | `SUPERADMIN` | Lista los paquetes con su descripción y un tamaño aproximado. |
| `POST` | `/admin/content-packs/:code/apply` | `SUPERADMIN` | Aplica un paquete y devuelve cuántas filas dejó. |

Pide `SUPERADMIN` y no un rol de organización porque aplicar un paquete cambia el
catálogo de **toda** la instalación.

## Decisiones

- **El catálogo es estático** (`content-packs.catalog.ts`), no una tabla. Cada
  paquete es un servicio de siembra concreto; una tabla obligaría a mantener
  sincronizados un registro en base y un `switch` en el código.
- **No hay estado de «aplicado».** Los seeds son idempotentes: volver a aplicar un
  paquete devuelve cero filas nuevas, y ese cero es el reporte de «ya estaba».
- **`apply` responde `200`, no `201`.** No crea un recurso identificable, y
  repetirlo es legítimo.
- **`CUENTAS_DEMO` exige `demoPassword`.** Es el único paquete que da de alta
  personas que después inician sesión. Sin la contraseña responde `422`.
- Un código inexistente responde `404`.

## Paquetes

| Código | Contenido | Filas aprox. |
|---|---|---|
| `GLOSARIO` | Taxonomía y términos médicos curados | 500 |
| `ESTABLECIMIENTOS_BO` | Establecimientos de salud de Santa Cruz | 503 |
| `ASEGURADORAS_BO` | Aseguradoras con su producto de salud y planes | 50 |
| `ARANCEL_BO` | Nomenclador de procedimientos con precio de referencia | 4 408 |
| `VADEMECUM` | Muestra de medicamentos con interacciones | 241 |
| `FORMULARIOS_CLINICOS` | Plantillas de ficha por especialidad | 43 |
| `CUENTAS_DEMO` | Cuentas de los socios comerciales | 4 |

Los números son orientativos: el resultado exacto depende de lo que ya haya en la
base.

