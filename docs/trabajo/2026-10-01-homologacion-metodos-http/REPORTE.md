# Reporte — Hito 3 (API): `PATCH /pharmacies/{pharmacyId}/products/{productId}`

> **AVANCE: 16 / 17 — 94,1 %.** Código, pruebas, contrato y PR (#527) listos; el gate de entrega queda A MEDIAS porque un check externo está en rojo (ver A medias).

- Fecha: 2026-10-01 · Plan: PLAN.md · Rama: `marcelo/fix-homologacion-metodos-http`, desde `origin/dev` (`f4fea3e6`) · PR gemelo en `mantra-core-health` (mismo nombre de rama)
- Peldaño de evidencia alcanzado: **TESTED** para el código (pruebas unitarias con `EntityManager` mockeado). **No** alcanza VERIFIED: no se ejercitó el endpoint HTTP ni la persistencia contra una base.

## Completado

| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H2.S1.M1 | Rama desde `origin/dev` sin upstream | `git rev-parse HEAD` | `f4fea3e63e72…` (`evidencia/01-rama.txt`) |
| H2.S1.M2 | PLAN en disco antes del primer cambio de código | `git status --short` | PASS |
| H2.S1.M3 | Baselines | `yarn typecheck` · `yarn test src/modules/pharmacy` | exit 0 · 18 suites, 218 pruebas (`02`, `03`) |
| H2.S2.M1 | `UpdateProductDto` (5 claves opcionales, `null` borra, `''` y excesos fallan) | spec del DTO | 19 casos verdes con las opciones del `ValidationPipe` del `main.ts` (`05`) |
| H2.S2.M2 | `toProductReadDto` extraído del mapeo de `searchProducts` | `pharmacy-read.service.spec.ts` sin tocar | verde (`05`) |
| H2.S2.M3 | `updateProduct` en el servicio | 7 casos nuevos | verdes (`05`); typecheck 0 (`04`) |
| H2.S2.M4 | `@Patch(':pharmacyId/products/:productId')` → 200 | `pharmacy.controller.spec.ts` | verde (`05`); lint 0 (`06`) |
| H2.S2.M5 | Specs de servicio (correcto, límite, inválido) y de controlador | `yarn test src/modules/pharmacy` | 19 suites, 245 pruebas (+27), exit 0 |
| H2.S2.M6 | El pipe global rechaza `unitPrice`, `inStock`, `status` y 6 claves más | spec del DTO | verde (`05`) |
| H2.S2.M7 | Fila del `PATCH` en el README del módulo | `yarn docs:modules:sync` | `docs/modules/pharmacy.md` regenerado (`10`) |
| H2.S3.M1 | Contrato con `patch` y `PharmacyUpdateProductDto` | `yarn build` · generador en modo `preview` · injerto | exit 0; `openapi.json` +118 líneas, `openapi.yaml` +84, 0 borradas (`07`, `08`, `09`) |
| H2.S3.M2 | Documentos derivados | generadores de endpoints, módulos y Postman; Redocly; detector de incompatibles | índices y `pharmacy.md` (`10`); Postman por fusión en tres vías (`11`); lint: 2 errores previos idénticos a `HEAD` (`12`, `12b`); sin cambios incompatibles (`13`) |
| H2.S4.M1 | Regresión del módulo | `yarn typecheck` · `yarn lint --max-warnings=0` · `yarn test src/modules/pharmacy` · `--findRelatedTests` | exit 0 · exit 0 · 19 suites y 245 pruebas · 15 suites y 209 pruebas (`04`, `05`, `06`, `14`) |
| H2.S4.M2 | Este reporte | — | en disco |
| H2.S4.M3 | Commit `faa03633` con rutas explícitas y push | `git push -u origin marcelo/fix-homologacion-metodos-http` | rama en `origin`; `origin/dev` sin cambios antes y después |
| H2.S4.M4 | PR a `dev` con los dos revisores | `gh pr create --reviewer jsaldias39,PabloArauzCaballero` | PR #527, no es draft |

## A medias

### H2.S4.M5 — Gate mergeable
- **Qué anda:** PR #527 abierto hacia `dev`, no es draft, `mergeable: MERGEABLE`, sin conflictos; `Jsaldias39` y `PabloArauzCaballero` figuran como revisores solicitados. `mergeStateStatus: BLOCKED` con `reviewDecision: REVIEW_REQUIRED`: falta la aprobación humana. En el CI, Compilar, Verificar tipos y Lint TypeScript quedaron en verde.
- **Qué no anda:** el check `docs` está en rojo en el paso «Auditoría de dependencias runtime» (`undici` entre 8.0.0 y 8.10.2, GHSA-rx4f-c7p8-82vq, que llega por `node-gyp`). Clase EXTERNAL: el mismo paso falló en tres corridas de ramas de `dev` sin este cambio y este PR no toca dependencias (`evidencia/17`).
- **Qué falta exactamente:** resolver el aviso de `undici` en un cambio aparte (actualizar la dependencia o fijarla con una resolución) y la aprobación humana. Hasta entonces los pasos posteriores del job (guardrails, pruebas con cobertura, contrato OpenAPI, artefactos al día) no se pueden observar en CI.
- **Dónde quedó:** rama `marcelo/fix-homologacion-metodos-http` en `origin`, PR #527; el estado se vuelve a consultar tras cada push.

## Pendiente

Ninguna.

## Evidencia

```text
$ yarn test src/modules/pharmacy                      (baseline, antes de tocar código)
Test Suites: 18 passed, 18 total
Tests:       218 passed, 218 total

$ yarn test src/modules/pharmacy                      (código final)
Test Suites: 19 passed, 19 total
Tests:       245 passed, 245 total

$ yarn test --findRelatedTests <5 archivos fuente cambiados>
Test Suites: 15 passed, 15 total
Tests:       209 passed, 209 total

$ yarn typecheck → exit=0        $ yarn lint --max-warnings=0 → exit=0

$ generador de OpenAPI (copia temporal con preview:true)
OpenAPI generado: 1314 paths, 1442 operaciones, 1276 esquemas.

$ injerto en el contrato versionado
0 · formateo del generador: JSON y YAML versionados se reproducen exactos
4 · operaciones nuevas: patch /pharmacies/{pharmacyId}/products/{productId} · esquemas nuevos: 1 (PharmacyUpdateProductDto, tras PharmacyCreateProductDto)

$ node tools/openapi/check-breaking.mjs --base <origin/dev> --head openapi/openapi.json
Sin cambios incompatibles no aprobados en el contrato OpenAPI.
```

Índice de `evidencia/`: `01` rama · `02` y `03` baselines · `04` typecheck · `05` pruebas del módulo · `06` lint · `07` build · `08` generación del contrato · `09` injerto · `10` generadores de documentación · `11` Postman · `12` y `12b` lint de Redocly (con y sin el cambio) · `13` incompatibles · `14` pruebas relacionadas · `15` cobertura documental y enlaces · `16` estado del PR · `17` clasificación de los checks.

## Gate de seguridad (área: medicamentos y catálogo)

| Amenaza | Control | Dónde | Prueba | Resultado |
|---|---|---|---|---|
| Editar un producto de otra farmacia cambiando la ruta (IDOR) | el producto debe pertenecer a `pharmacyId`, si no 404 indistinguible de «no existe» | `PharmacyProductsService.updateProduct` | caso «otra farmacia» | PASS, sin cambios ni `flush` |
| Colar precio, estado o conceptos (mass assignment) | `whitelist` + `forbidNonWhitelisted` y un DTO de 5 claves | `UpdateProductDto`, `main.ts:191` | 9 claves rechazadas con «property … should not exist» | PASS |
| Acceso sin el rol | `@Roles('SECURITY_ADMIN')` de clase | `PharmacyController` | no ejercitado aquí | **No cubierto** |
| Editar un producto retirado | 422 si no está `PRODUCT_ACTIVE` | servicio | caso «retirado» | PASS |
| Datos de personas en logs | el log lleva ids y nombres de campo, nunca valores | servicio | revisión del diff | PASS por lectura |

Riesgo residual: la autorización sigue siendo «rol global `SECURITY_ADMIN`», no «miembro del tenant dueño de la farmacia» (P47 §1, fuera de alcance). Un administrador de seguridad puede editar productos de cualquier farmacia, igual que ya puede publicarlos y retirarlos.

## No cubierto

1. **Persistencia.** No hay int-spec de farmacia ni una base segura en esta máquina. No se comprobó que `null` escriba `NULL` en la columna: por lectura del comparador de MikroORM 7.1.7 el diff sale con `null`, pero no se ejecutó.
2. **Endpoint HTTP.** No se llamó al `PATCH` con un token ni se levantó la API (decisión del usuario: verificar por contrato). El `ValidationPipe` se ejercitó con sus mismas opciones sobre el DTO, no dentro de la app.
3. **Suite unitaria completa (548 suites).** Se lanzó y se detuvo a los 35 minutos sin resultado: `maxWorkers` está en 2 a propósito para esta máquina y la tarea en segundo plano tiene un tope de 30. Se sustituyó por las 19 suites del módulo y las 15 relacionadas por grafo de imports. El CI sí correrá la completa.
4. **Generador oficial de OpenAPI.** No corrió: necesita almacenes, Docker está caído y el `.env` apunta a Neon y Atlas, que no se usan sin autorización. Se usó el modo `preview` de Nest.
5. **`yarn test:integration` y `yarn smoke`.** No se corrieron: exigen Postgres y truncan o mutan datos.
6. **CI completo.** Corrió sobre el PR: Compilar, Verificar tipos y Lint en verde; el job `docs` falla en la auditoría de dependencias, igual que en las corridas 36784392323, 36872393440 y 36872589204 de ramas de `dev`, y los pasos posteriores (guardrails, pruebas con cobertura, contrato OpenAPI, artefactos al día) no llegan a ejecutarse.
7. **Cobertura documental y enlaces.** `yarn docs:coverage` falla con 4 problemas (módulos `ops_console` y `public` sin página) y `yarn docs:links` con 15 hallazgos, todos en archivos que este trabajo no toca (`evidencia/15`). Este trabajo suma dos páginas huérfanas (PLAN y REPORTE), como las demás de `docs/trabajo`.

## Desvíos del plan

- **H2.S3 con modo `preview` e injerto en vez de regeneración completa.** Al generar apareció que el contrato versionado ya estaba desactualizado: 27 operaciones ajenas sin documentar y 7 modificadas (campañas de seguros, `charts/me`, especialidades del profesional, promociones…), con controladores presentes en `origin/dev`. Los índices de endpoints decían 1374 operaciones y la colección de Postman 1372 cuando el propio `openapi.json` tenía 1414; Postman se regeneró por última vez el 25/09. Commitear la regeneración completa traía unas 6 500 líneas de otros carriles, así que se injertó sólo la operación `patch`, su esquema y lo que cuelga de farmacia, con el formateo exacto del generador (verificado byte a byte sobre el JSON y el YAML versionados).
- **`minLength: 1` declarado en el DTO.** El generador no infiere `@MinLength` de class-validator; se agregó a `ApiPropertyOptional` para que el contrato diga que `''` se rechaza. Se recompiló y se repitió la generación.
- **Constructor.** `PharmacyReadRepository` entra antes de `logger`, no como último parámetro, para que `logger` siga al final como en el resto de servicios.

## Riesgos residuales y deuda

- El contrato, los índices de endpoints y la colección de Postman versionados están desactualizados respecto del código de `dev`. Se recomienda un PR propio de regeneración completa; el modo `preview` de Nest permite hacerlo sin almacenes (copia del generador con `preview: true` y variables del CI a `localhost`).
- Con este PR, los índices globales de endpoints siguen diciendo 1374 y la colección de Postman 1372 en su encabezado: sólo se actualizó la fila de farmacia y la carpeta `pharmacies (12)`.
- La edición cubre cinco columnas. Precio, stock, categoría, descripción, imágenes y borrador siguen sin lugar donde guardarse (P47 §3-5, trabajo de modelo).

## Decisiones y ambigüedades

| Decisión o ambigüedad | Supuesto tomado | A quién confirmarlo |
|---|---|---|
| Un cuerpo `{}` | responde 200 con el producto sin cambios y no toca `updated_at` (idempotente); la alternativa era 400 | Pablo |
| `''` en un texto | 400 (`MinLength(1)`); borrar es mandar `null`. El alta (`CreateProductDto`) sí deja pasar `''` | Pablo |
| Producto retirado | 422, igual que retirarlo dos veces | Pablo |
| Quién puede editar | el `@Roles('SECURITY_ADMIN')` de clase, como el alta y el retiro (P47 §1) | Pablo y Justin |
| Regeneración parcial del contrato | injerto mínimo y regeneración completa como seguimiento | Pablo |
