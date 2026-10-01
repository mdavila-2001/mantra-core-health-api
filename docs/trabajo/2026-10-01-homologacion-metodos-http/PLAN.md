# Plan — Hito 3 (API): `PATCH /pharmacies/{pharmacyId}/products/{productId}`

- Fecha: 2026-10-01 · Repos afectados: `mantra-core-health-api` (este) y `mantra-core-health` (rama gemela con el mismo nombre; su plan vive en el repo del frontend) · Predecesor: Hito 1 (este repo, PR #520, mergeado)
- Resultado observable: la API publica `PATCH /pharmacies/{pharmacyId}/products/{productId}` y la auditoría de rutas entre el simulador del frontend y los controladores deja de listar el desajuste #7 (`PATCH` del simulador contra el `DELETE` de la API).
- Kill-test: `openapi/openapi.json` no tiene `patch` en `/pharmacies/{pharmacyId}/products/{productId}`, o un `PATCH` con `unitPrice` no responde 400.
- Rama: `marcelo/fix-homologacion-metodos-http` desde `origin/dev` (`f4fea3e6`). Reviewers: `jsaldias39`, `PabloArauzCaballero`. Orden de despliegue: este PR primero.

## Contexto verificado (`origin/dev` del 2026-10-01)

- `PharmacyController` sólo tiene `POST …/products` (alta, UC-24-04) y `DELETE …/products/{productId}` (retiro, UC-24-09). No hay edición: P47 §2 de `PENDIENTES-BACKEND.md` del frontend.
- El frontend ya llama `PATCH` (`PharmacyClient.updateProduct`) y su simulador lo atiende; la pantalla con edición sólo se monta con `mockBackend` activo.
- `pharmacy.pharmacy_products` guarda estas columnas editables: `brand_name`, `generic_name`, `strength_text`, `package_size_text`, `requires_prescription`. No tiene precio, categoría, descripción, existencias, estado de borrador ni imágenes (P47 §3-5: son trabajo de modelo).
- `ValidationPipe` global con `whitelist` y `forbidNonWhitelisted` (`src/main.ts:191-196`): toda clave que el DTO no declare responde 400.
- La entidad `PharmacyProducts` es generada y tipa esas columnas como `T | undefined`; `null` es lo que las borra. MikroORM 7.1.7 escribe `NULL` cuando el valor actual es `null` y el previo no (`EntityComparator.getGenericComparator`).

## Alcance

- IN: DTO nuevo, extracción del mapeo de lectura del producto, método de servicio, ruta del controlador, specs de servicio y controlador, README del módulo y los artefactos generados que el CI compara (`openapi/`, `docs/modules`, `docs/postman`); PLAN, REPORTE y evidencia; commit, push y PR con reviewers.
- OUT: autorización por organización (P47 §1: todo `PharmacyController` es `@Roles('SECURITY_ADMIN')`, el `PATCH` lo hereda como el alta y el retiro); precio, stock, categoría, descripción, imágenes y borrador (P47 §3-5); editar `productCode`, `medicationConceptId`, `dosageFormConceptId`, fabricante o identificadores; entidades, DDL y modelo; arreglar el rojo previo del job `docs` (`yarn npm audit`); `.env`, bases en la nube y el stack Docker `mantra-redesa`; mergear el PR.
- Ambigüedades registradas:
  1. Un cuerpo `{}` responde 200 con el producto sin cambios y no toca `updated_at` (idempotente). Alternativa: 400. Confirmar con Pablo.
  2. `''` se rechaza con 400 (`MinLength(1)`); borrar un dato es mandar `null`. El alta (`CreateProductDto`) sí deja pasar `''`.
  3. Un producto retirado responde 422 (`PreconditionFailedException`), como el retiro cuando ya está retirado; no se puede «re-editar» un retirado.
  4. No hay int-spec de farmacia ni una base segura en esta máquina: la persistencia del `PATCH` (incluido que `null` escriba `NULL`) queda **No cubierta** y se declara.
  5. **Resuelto con un desvío del plan.** El generador oficial instancia los proveedores y necesita almacenes: Docker está caído y el `.env` apunta a Neon y Atlas, que no se usan sin autorización. Se generó el contrato en modo `preview` de Nest (no instancia proveedores ni abre conexiones) con una copia temporal del generador, ya eliminada. El contrato, los índices y la colección de Postman versionados **ya estaban desactualizados antes de este trabajo** (27 operaciones ajenas sin documentar, 7 modificadas, contadores globales viejos), así que no se commitea la regeneración completa: se injertó sólo la operación `patch`, su esquema y lo que cuelga de farmacia, con el formateo exacto del generador (`evidencia/09`, `11`). La regeneración completa queda como seguimiento y no se hizo aquí para no mezclar el trabajo de otros carriles.

## H2 — La API publica la edición de los datos descriptivos de un producto

**CA:** Dado un producto activo de la farmacia, cuando `SECURITY_ADMIN` manda `PATCH` con cualquiera de `brandName`, `genericName`, `strengthText`, `packageSizeText`, `requiresPrescription` (cada uno opcional; `null` lo borra), entonces responde 200 con el producto como lo lista `GET /pharmacy/products` y sólo cambian los campos enviados; un producto inexistente o de otra farmacia responde 404; uno retirado, 422; y una clave fuera del DTO (`unitPrice`, `inStock`, `status`…), 400.
**DoD:** `yarn typecheck` 0 · `yarn lint --max-warnings=0` 0 · `yarn test src/modules/pharmacy` verde · artefactos generados regenerados y diffeados · `openapi.json` con `patch`.
**Estado:** EN CURSO

### H2.S1 — Preparación
| ID | Microtarea | CA (binario) | DoD (comando) | Estado |
|---|---|---|---|---|
| H2.S1.M1 | Rama desde `origin/dev` sin upstream | HEAD = `f4fea3e6` | `git rev-parse HEAD` (`evidencia/01-rama.txt`) → HEAD = `f4fea3e63e72…` (`evidencia/01-rama.txt`) | HECHO |
| H2.S1.M2 | Este PLAN antes del primer cambio de código | archivo en disco | `git status --short docs/trabajo/2026-10-01-homologacion-metodos-http/PLAN.md` → en disco antes del primer cambio de código | HECHO |
| H2.S1.M3 | Baselines: typecheck y `yarn test src/modules/pharmacy` | verdes antes de tocar nada | `evidencia/02-…`, `03-…` → typecheck exit 0 (`02-typecheck-baseline.txt`); `yarn test src/modules/pharmacy`: 18 suites, 218 pruebas, exit 0 (`03-test-pharmacy-baseline.txt`) | HECHO |

### H2.S2 — Contrato, servicio y ruta
| ID | Microtarea | CA (binario) | DoD (comando) | Estado |
|---|---|---|---|---|
| H2.S2.M1 | `dto/update-product.dto.ts` (`PharmacyUpdateProductDto`) y su export | 5 claves opcionales; `null` pasa; `''` y excesos fallan | spec del DTO (M6) verde → DTO escrito; falta su spec (M6) → spec del DTO verde: 19 casos con el `ValidationPipe` del `main.ts` (`05-test-pharmacy.txt`) | HECHO |
| H2.S2.M2 | `pharmacy-read.service.ts`: extraer `toProductReadDto` del mapeo de `searchProducts` | `searchProducts` devuelve lo mismo | `yarn test src/modules/pharmacy/services/pharmacy-read.service.spec.ts` verde sin tocar el spec → `toProductReadDto` extraído; falta correr el spec de lectura → `pharmacy-read.service.spec.ts` verde sin tocar el spec (`05-test-pharmacy.txt`) | HECHO |
| H2.S2.M3 | `pharmacy-products.service.ts`: `updateProduct` (404, 422, no-op, `null` borra, `touch`, respuesta de lectura) | cumple el CA | specs de M5 → 7 casos de `updateProduct` verdes (`05`); typecheck exit 0 (`04-typecheck.txt`) | HECHO |
| H2.S2.M4 | `pharmacy.controller.ts`: `@Patch(':pharmacyId/products/:productId')` → 200, `@ApiOkResponse` | delega al servicio | `pharmacy.controller.spec.ts` verde → `pharmacy.controller.spec.ts` verde (`05`); lint 0 (`06-lint.txt`) | HECHO |
| H2.S2.M5 | Specs de servicio (tres niveles: correcto, límite, inválido) y de controlador | todos verdes | `yarn test src/modules/pharmacy` → 19 suites, 245 pruebas (antes 18 y 218), exit 0 (`05-test-pharmacy.txt`) | HECHO |
| H2.S2.M6 | Spec del DTO con el `ValidationPipe` del `main.ts` (`whitelist`, `forbidNonWhitelisted`) | `unitPrice`/`inStock`/`status` → 400; `null` → pasa; `''` → 400 | `yarn test src/modules/pharmacy/dto` → `unitPrice`, `inStock`, `status` y 6 claves más → 400; `null` pasa; `''` → 400 (`05`) | HECHO |
| H2.S2.M7 | `README.md` del módulo: fila del `PATCH` | la tabla lo lista | `yarn docs:modules:sync` sin error → fila escrita; falta `yarn docs:modules:sync` → `yarn docs:modules:sync` regeneró `docs/modules/pharmacy.md` con la fila (`evidencia/10-docs-generadores.txt`) | HECHO |

### H2.S3 — Artefactos que el CI compara (`docs.yml`, paso «artefactos generados al día»)
| ID | Microtarea | CA (binario) | DoD (comando) | Estado |
|---|---|---|---|---|
| H2.S3.M1 | `yarn build` y `node tools/openapi/generate-openapi.mjs` con los almacenes a `localhost` y los sembradores apagados | `openapi.json` y `.yaml` con `patch` en la ruta | `python -c` sobre el JSON regenerado → `yarn build` exit 0 (`07`); contrato en modo `preview` (`08`) e injertado (`09`): `patch` y `PharmacyUpdateProductDto` en `openapi.json` y `.yaml`, 202 inserciones y 0 borrados; el formateo del generador reproduce byte a byte el JSON y el YAML versionados | HECHO |
| H2.S3.M2 | `docs:endpoints:generate`, `docs:modules:sync`, `docs:data:sync`, `postman:generate`, `docs:openapi:lint` | sólo cambian `openapi/`, `docs/modules`, `docs/postman` | `git status --short` acotado → índices y `pharmacy.md` (`10`), Postman por fusión en tres vías (`11`), lint de Redocly: 2 errores previos idénticos a `HEAD`, ninguno nuevo (`12`, `12b`), sin cambios incompatibles (`13`) | HECHO |

### H2.S4 — Regresión y entrega
| ID | Microtarea | CA (binario) | DoD (comando) | Estado |
|---|---|---|---|---|
| H2.S4.M1 | `yarn typecheck`, `yarn lint --max-warnings=0`, `yarn test src/modules/pharmacy` | exit 0 | los tres comandos → typecheck exit 0 (`04`), lint con 0 advertencias exit 0 (`06`), `yarn test src/modules/pharmacy`: 19 suites y 245 pruebas, exit 0 (`05`) y 15 suites relacionadas por grafo de imports, 209 pruebas, exit 0 (`14-test-relacionadas.txt`). La suite completa no terminó: ver REPORTE | HECHO |
| H2.S4.M2 | `REPORTE.md` (avance en la primera línea; No cubierto: persistencia y runtime) | archivo en disco | — → `REPORTE.md` en disco, con avance en la primera línea y «No cubierto» | HECHO |
| H2.S4.M3 | Commit con rutas explícitas (nunca `git add -A`) y push | rama en `origin` | `git push -u origin marcelo/fix-homologacion-metodos-http` → commit `faa03633` con rutas explícitas; `git push -u`: rama en `origin`, `origin/dev` sin cambios antes y después | HECHO |
| H2.S4.M4 | PR a `dev` con `jsaldias39` y `PabloArauzCaballero` | PR abierto | `gh pr create …` → PR #527 hacia `dev`, no es draft, con `Jsaldias39` y `PabloArauzCaballero` | HECHO |
| H2.S4.M5 | Gate mergeable | `mergeable` = `MERGEABLE`; checks clasificados | `gh pr view <n> --json …` y `gh pr checks <n>` → `MERGEABLE`, `BLOCKED` por la revisión humana requerida; el check `docs` falla en la auditoría de dependencias (EXTERNAL, previo): `evidencia/16`, `17` | A MEDIAS |

## Gate de seguridad (área sensible: medicamentos y catálogo)

| Amenaza | Control | Dónde | Prueba |
|---|---|---|---|
| IDOR: editar un producto de otra farmacia cambiando la ruta | el producto debe pertenecer a `pharmacyId` o responde 404 | `PharmacyProductsService.updateProduct` | spec de servicio, caso «otra farmacia» |
| Mass assignment: colar precio, estado o conceptos | `whitelist` + `forbidNonWhitelisted` y DTO de 5 claves | `UpdateProductDto`, `main.ts:191` | spec del DTO |
| Acceso sin rol | `@Roles('SECURITY_ADMIN')` de clase, guard global | `PharmacyController` | **No cubierto** aquí: lo ejercita la suite de guards, no este spec |
| Transición inválida: editar un retirado | 422 si no está `PRODUCT_ACTIVE` | servicio | spec de servicio, caso «retirado» |
| Datos de personas en logs | el log lleva ids y nombres de campo, nunca valores | servicio | revisión del diff |

## Riesgos y bloqueos previstos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| El generador de OpenAPI no bota sin almacenes | H2.S3 `BLOQUEADO` | intentar con `localhost` como el CI; si falla, pedir decisión (Docker en proyecto `-p` aislado, nunca `down -v` de `mantra-redesa`) |
| `yarn test` sin el flag ESM | falso rojo de `@mikro-orm` | usar siempre `yarn test [ruta]` |
| El job `docs` ya falla en `dev` por `yarn npm audit` | PR `UNSTABLE` por causa previa | clasificar `EXTERNAL` con las corridas 36784392323, 36872393440 y 36872589204 |
| Heredocs largos en el shell | comando abortado | documentos con la herramienta Write; edición de código con script Python de sustitución exacta |
