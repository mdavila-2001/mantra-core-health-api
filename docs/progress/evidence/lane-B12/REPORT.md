# Reporte — B12 · Los directorios públicos y la farmacia dicen la verdad (M4 · H2)

> **AVANCE: 3 / 3 — 100,0 %** de las microtareas del carril. **Peldaño alcanzado: `TESTED`**, el techo
> honesto sin base de datos que fija el encargo. Esta vez `TESTED` incluye pruebas **por HTTP**: una app de
> Nest real con el módulo, el `ValidationPipe` global y los filtros de excepción, con una base doble. **No
> es `VERIFIED`:** el SQL no corrió contra Postgres; eso lo hace M1 (ver «Lo que le falta correr a M1»).

- Fecha: 2026-09-26 · Máquina: **M4 · Dell Inspiron 2** · Plan: [PLAN.md](./PLAN.md) · Decisiones: [DECISIONS.md](./DECISIONS.md)
- Rama: `justin/test-b12-fichas-publicas-servicios-productos`, desde `origin/test` @ `002bdfdd`, PR contra `test`
- Compuertas: `yarn typecheck` exit 0 · `yarn lint` exit 0 · `yarn test --testPathPatterns="modules/public|community|pharmacy|billing|app.module.wiring"` **902/902** (78 suites)

## Completado

| ID | Qué se logró (observable en la prueba) | Comando | Resultado |
|---|---|---|---|
| H2.S1.M1 | `GET /public/profiles/o/:slug/services`, sin token → 200 con `{items, nextCursor, totalHint, generatedAt}`. Cada ítem: `id`, `code`, `name`, `description`, `price` (texto exacto), `currency`, `isActive`. Se arma **campo por campo**: ni tenant, ni práctica, ni cuenta de ingresos, ni código impositivo. Un precio en cero viaja `null` (Q-05). Un servicio dado de baja se lista rotulado. Keyset por `(code, id)`. Si el slug no existe o es de otro tipo, responde **el mismo 404**. `limit` fuera de [1, 50], un parámetro no declarado o un cursor corrupto dan 400. | `yarn test --testPathPatterns="modules/public\|app.module.wiring"` | **Antes:** las rutas no existían en `origin/test` ([`H2.S1-antes.txt`](./evidencia/H2.S1-antes.txt)). **Después:** PASS 33/33 en 5 suites ([`H2.S1-verde.txt`](./evidencia/H2.S1-verde.txt)) y por HTTP ([`H2.S1-http.txt`](./evidencia/H2.S1-http.txt)). |
| H2.S1.M2 | `GET /public/profiles/f/:slug/products`, sin token → 200 con la misma envoltura. Cada ítem: `genericName`, `brandName`, `presentation`, `price` (el vigente más bajo de una lista **pública** sin aseguradora, como texto), `currency`, `inStock`, `requiresPrescription`. Un producto agotado **se lista** con `inStock=false`. Sin precio publicado, `price` viaja `null`. `therapeuticGroup` viaja `null`: no es columna y no se inventa. Filtros de publicación iguales al marketplace: farmacia activa y verificada, producto activo, lista vigente. | mismo | PASS |
| H2.S1.M3 | D-F (farmacias 24 h y de turno) registrada con sus tres formas posibles, **sin resolverla**. | — | [DECISIONS.md → Q-03](./DECISIONS.md) |

**Registro en el arranque:** `PublicCatalogModule` quedó importado en `AppModule`, y lo cubre
`app.module.wiring.spec.ts`. Comprobé que ese guardia **caza** la omisión: con `app.module.ts` de
`origin/test` da rojo ([`H2.S1-cableado-rojo-sin-registro.txt`](./evidencia/H2.S1-cableado-rojo-sin-registro.txt));
con el registro, verde ([`H2.S1-cableado-verde.txt`](./evidencia/H2.S1-cableado-verde.txt)).

## A medias

Ninguna.

## Pendiente

| ID | Estado | Qué lo destraba |
|---|---|---|
| — (D-F) | `BLOQUEADO` por decisión de negocio | El propietario elige A, B o C (Q-03). Después empieza en el modelo con M1. Mientras tanto, `openNow` sigue `null` y las fichas no publican horario. |

## Lo que le falta correr a M1 (de `TESTED` a `VERIFIED`)

1. Arrancar la API de esta rama y buscar en el log `Mapped {/public/profiles/o/:slug/services, GET}` y
   `Mapped {/public/profiles/f/:slug/products, GET}`.
2. `curl` **sin token** a las dos rutas con un slug de organización y otro de farmacia sembrados, y pegar la
   respuesta. Revisar que no aparezcan `incomeAccountId`, `taxCodeId`, `practiceId` ni `tenantId`.
3. Pedir un slug de farmacia como `o/` → 404 con la misma forma que un slug inexistente.
4. Paginar: `?limit=1` y luego `?cursor=<nextCursor>` hasta el final, sin repetir ni saltear filas.
5. Con el log SQL de MikroORM encendido: **una** consulta por página, con `LIMIT`.

## Pedidos

- **A M5 (front):** las dos lecturas ya responden con el contrato de `public-catalog.types.ts`. Contra la
  API real, la ficha deja el estado de error. Detalles: `therapeuticGroup` viaja siempre `null` y
  `requiresPrescription` es `false` cuando no hay dato. Las sucursales (`…/branches`,
  `…/branch-availability`, P37) **no** son de este encargo y siguen en 404.
- **Al dueño de `app.module.wiring.spec.ts`:** el spec reconoce un módulo por la metadata `imports`, y
  `@Module` sólo la define si la clave está presente. Un módulo sin `imports` puede quedar huérfano sin que
  el spec lo note. En este carril lo esquivé declarando `imports: []`. El arreglo de fondo (reconocer
  también `controllers` o `providers`) va en ese spec, fuera de mi alcance.

## Evidencia

En [`evidencia/`](./evidencia/). La primera línea de cada archivo es el comando, seguida de la salida literal:

- `gate-typecheck.txt`, `gate-lint.txt`, `gate-regresion.txt` (`modules/public|community|pharmacy|billing|app.module.wiring`)
- `H2.S1-antes.txt` → `H2.S1-verde.txt`, `H2.S1-http.txt`
- `H2.S1-cableado-rojo-sin-registro.txt` → `H2.S1-cableado-verde.txt`

## No cubierto

- **Nada corrió contra Postgres.** El SQL está fijado por specs que revisan qué proyecta, qué filtra, el
  keyset y el `LIMIT`, pero ninguna fila real pasó por él.
- **El throttle (60 por minuto)** está declarado con `@Throttle`, pero la app de prueba no monta el
  `ThrottlerGuard` global. El 429 queda sin ejercitar.
- **La caché pública** (`public-cache.interceptor.ts`: ETag, `Cache-Control`, 304) aplica a todo `GET
  @Public()` y tampoco se ejercitó.
- **Sucursales, disponibilidad por receta, ciudad en los cinco verticales, tendencias, paginación de
  laboratorios y medicamentos, y la edición de descripción e imagen en «Mis servicios»:** vienen de BR-23,
  pero **no** están en el encargo de M4. No se tocaron.

## Desvíos del plan

- Se sumó una prueba por HTTP que el plan no pedía, para demostrar enrutado, DI, 400 y 404 sin base.
- Se declaró `imports: []` en el módulo después de medir que, sin esa clave, el guardia del cableado no lo
  veía.

## Riesgos residuales

- Si el propietario decide que un servicio con precio 0 puede ser gratuito a propósito, la proyección debe
  cambiar, y además hace falta una marca en el modelo (Q-05).
- `pharmacies.tenant_id` es el enlace entre el slug y los productos. Si una farmacia pública tuviera su
  perfil sólo por `public_profile_id` con otro tenant, no mostraría productos. Hoy el directorio proyecta
  `target_id = tenant_id`, así que no pasa.

## Decisiones y ambigüedades

Ver [DECISIONS.md](./DECISIONS.md): Q-03 (D-F), Q-05 (qué es «sin precio») y Q-08 (`haversineKm` duplicado:
registrado, no tocado). Ninguna se resolvió por conveniencia.
