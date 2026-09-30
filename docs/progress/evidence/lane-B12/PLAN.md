# Plan — B12 · Los directorios públicos y la farmacia dicen la verdad (M4 · H2)

- Fecha: 2026-09-26 · Máquina: **M4 · Dell Inspiron 2** · Repo: `mantra-core-health-api`
- Rama: `justin/test-b12-fichas-publicas-servicios-productos`, desde `origin/test` @ `002bdfdd`, PR contra `test`
- Encargo: `AlovidaPromptManager/repartos/2026-09-26/PromptMaquinas/M4-DellInspiron2/Preproduccion.ApiAgendaDirectoriosYDinero/AgendaFarmaciaCotizacionesYContabilidad.md` (§5, H2)
- Prompt de brechas de origen: `mantra-core-health/docs/brechas-front-back-2026-09-24/prompts/BR-23-directorios-publicos.md` (P30, P31)
- Resultado observable: sin sesión, `GET /public/profiles/o/:slug/services` devuelve los servicios de una
  organización con su precio de referencia, y `GET /public/profiles/f/:slug/products` los productos de una
  farmacia con marca, precio y si hay stock; las dos con la envoltura pública
  `{items, nextCursor, totalHint, generatedAt}` que el front ya espera, en vez de 404.
- Kill-test: pedir cualquiera de las dos rutas. Si la API responde 404 por ruta inexistente, no está hecho.
- Techo honesto sin base de datos: **`TESTED`**. El `Mapped {/public/profiles/o/:slug/services}` del arranque y
  el `curl` sin token los corre M1.

## Alcance

- **IN:** `src/modules/public/**` (módulo **nuevo**: el encargo lo nombra y no existía), su registro en
  `src/app.module.ts` (una línea de import y una en `imports`), y esta carpeta de evidencia.
- **OUT:** `community` (ahí vive `public/profiles/:prefijo/:slug`; no se toca: las rutas nuevas tienen tres
  segmentos y no chocan), sucursales y `branch-availability` (P37: no están en el encargo de M4), `openNow` y
  farmacias de turno (D-F), `therapeuticGroup` (no es columna: no se inventa), delivery, pasarela de pago,
  DDL, `@Roles`.
- **Ambigüedades registradas:** Q-03 (D-F) y Q-05 (qué es «sin precio»), en [`DECISIONS.md`](./DECISIONS.md).

## Hechos medidos (peldaño `DISCOVERED`)

| Hecho | Dónde |
|---|---|
| Las cuatro rutas de fichas (`o/:slug/services`, `f/:slug/products`, `…/branches`, `…/branch-availability`) no existen: `grep` sin coincidencias | todo el repo |
| El front ya las llama con esa envoltura y esos campos | front `origin/test`: `core/data-access/public-catalog/public-catalog.client.ts:49-76`, `public-catalog.types.ts` |
| Un slug se resuelve en `community.public_profiles` (visible + activo); para organización y farmacia `target_id = tenant_id` | `community/repositories/public-search.repository.ts:1096-1105`, `directory/services/directory-tenants.service.ts:293-296` |
| Los servicios publicables salen de `billing.service_catalog` (nombre, código, descripción, precio, moneda, activo) vía `practice.practices.tenant_id`; `practice.healthcare_services` **no tiene nombre ni precio** | `17_billing/02_tables.sql:5-23`, `14_practice/02_tables.sql:115-132` |
| Los servicios por defecto se siembran con `defaultPrice: '0.00'`, que «Mis servicios» lee como «Definí el precio» | `billing/default-services.ts:28` |
| Productos: `pharmacy.pharmacy_products` + precio de lista **pública** vigente (`COALESCE(patient_amount, unit_amount)`) + stock de `inventory_stock_positions`; mismos filtros que el marketplace | `pharmacy/repositories/pharmacy-marketplace.repository.ts:89-238` |
| Paginación: `encodeKeysetCursor`/`decodeKeysetCursor` comunes (cursor corrupto → 400) | `src/common/pagination/keyset-cursor.ts` |

## H2 — Los directorios públicos y la farmacia dicen la verdad

**CA:** Dada la ficha de una clínica o de una farmacia, cuando se consulta, entonces trae sus servicios o
sus productos.
**DoD:** microtareas de H2 en `HECHO`, con las unitarias en verde y las rutas nuevas documentadas (Swagger +
este plan); `typecheck` y `lint` exit 0.
**Estado:** HECHO — peldaño `TESTED` (ver REPORT.md)

### H2.S1 — Las lecturas que el front ya llama y no existen

**CA:** Dadas `o/:slug/services` y `f/:slug/products`, cuando el front las llama, entonces la API responde en
vez de 404.
**DoD:** las tres microtareas en `HECHO` con las unitarias pegadas.
**Estado:** HECHO — peldaño `TESTED` (ver REPORT.md)

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H2.S1.M1 | Agregar la lectura de servicios de una organización | responde `@Public` con precio de referencia en texto, `null` cuando no hay precio definido, sin campos internos; un slug de otro tipo da el mismo 404 que uno inexistente | `yarn test --testPathPatterns=public-catalog` → verde pegado | HECHO |
| H2.S1.M2 | Agregar la de productos de una farmacia | responde con genérico, marca, presentación, precio en texto y `inStock`; un agotado se lista, no se esconde | `yarn test --testPathPatterns=public-catalog` → verde pegado | HECHO |
| H2.S1.M3 | Registrar D-F | queda en `DECISIONS.md` | enlace pegado | HECHO |

## Riesgos y bloqueos previstos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Las consultas SQL no se ejercitan sin base | quedan en `TESTED` | specs que fijan el SQL (keyset, `LIMIT`, filtros de publicación) + pedido a M1 del `curl` sin token |
| Registrar un módulo en `app.module.ts` toca un archivo compartido | conflicto de merge trivial con otra máquina | dos líneas, al final de su grupo; M1 integra |
| `forbidNonWhitelisted` también aplica al `@Query()` con DTO | un parámetro de más da 400 | es lo pedido por BR-23 («validá cada uno para no aceptar basura en silencio»); el front sólo manda `cursor` y `limit` |
