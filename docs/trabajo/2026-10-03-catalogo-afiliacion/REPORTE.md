# Reporte — Catálogos de afiliación del alta de organización

> **AVANCE: 16 / 16 microtareas HECHO.** Peldaño alcanzado: **`VERIFIED`** (comportamiento observado en runtime: reproducido en rojo, corregido y verde por API y por navegador). **NO se declara `REGRESSION_VERIFIED`** (corrección del 2026-10-03, ver «Actualización posterior al merge»): el CI del front nunca corrió, el CI de la API sobre `dev` está en rojo por un fallo previo ajeno, no se verificó el servidor desplegado y la revisión visual independiente rechazó 4 pantallas por causas ajenas.

- Fecha: 2026-10-03 · Plan: [PLAN.md](./PLAN.md)
- Base de las PR: `test` (la rama que despliega el servidor).
- Ramas: API `justin/catalogo-afiliacion-seed-test` · front (alta) `justin/alta-organizacion-boton-y-e2e-test` · front (delivery) `justin/sin-delivery-test`.

## Causa raíz (demostrada, no supuesta)
`POST /iam/auth/register-organization` respondía **422 «El catálogo de documentos de afiliación no está disponible»** porque `AffiliationDocumentConceptsService` busca por código cuatro value sets (`VS_AFFILIATION_DOCUMENT_TYPE`, `VS_ISSUING_AUTHORITY`, `VS_AFFILIATION_DOCUMENT_VERIFICATION_STATUS`, `VS_LEGAL_REPRESENTATIVE_ROLE`) que **ningún seeder de la API creaba**: sólo venían del paquete de seeds del modelo, que el despliegue no carga (defecto D6 del 26/09, nunca cerrado).

Un segundo defecto, descubierto al hacer clic de verdad: en la pantalla de aseguradora, **«Ir a iniciar sesión» no hacía nada** tras un alta exitosa, porque el componente no importaba `AppButton` y `(clicked)` nunca se disparaba. Lo que `tsc` no ve y el test viejo no atrapaba (llamaba el método en vez de hacer clic).

## Completado
| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1.M1–M4 | Seeder idempotente de los 4 catálogos (28 conceptos), registrado en `seed-cli`; README | `yarn typecheck` · `yarn eslint --max-warnings=0` · specs dirigidos | exit 0 · exit 0 · 31/31 (`evidencia/h1-*.log`) |
| H2.M1 | Stack local mínimo con tope de memoria (Postgres 2 GB, Mongo 768 MB, Redis 128 MB), base en frío | `docker compose --profile local-db up` + `postgres-init` | init exit 0; 1 243 tablas; 0 value sets |
| H2.M2 | **Kill-test en rojo, reproducido** | `MODE=kill node h2-matriz-api.mjs` | `422 … {"valueSet":"VS_AFFILIATION_DOCUMENT_TYPE"}` (`evidencia/h2-kill-test.txt`) |
| H2.M3 | Con el arreglo: misma API sin reiniciar → 201; 3.ª pasada del seed inserta 0 | `node dist/src/seed-cli.js` ×3 | #1: 25 pasos, 0 fallos, mi paso +68 filas · #2 repara +36 · **#3 `inserted: 0`** |
| H2.M4 | Matriz del alta por API (válido / límite / error) | `node h2-matriz-api.mjs` | **32 PASS / 0 FAIL** (`evidencia/h2-matriz-api.resultado.md`) |
| H2.M5 | Int-specs reales del alta contra Postgres | `yarn test:integration --runInBand organization-legal-documents organization-legal-representative` | 2 suites · 16 tests · exit 0 |
| H2.M6 | Regresión de áreas vecinas | `yarn test --maxWorkers=2 src/common/seed src/modules/directory src/modules/iam` | 62 suites · 773 tests · exit 0 |
| H3.M1 | Recorrido de navegador del alta contra la API real | `E2E_API_REAL=1 … yarn pw registro-organizacion-api-real --workers=1` | **10 passed** |
| H3.M2 | Botón muerto «Ir a iniciar sesión» corregido, con regresión | `yarn test … register-organization` con y sin el arreglo | sin arreglo: 1 falla · con arreglo: 74/74 |
| H4.M1 | Delivery fuera de la pantalla: checkout, «Confirmá tu pedido», diálogo de disponibilidad, perfil público de farmacia, textos de registro y maqueta | `git diff --stat` | 22 archivos |
| H4.M2 | Specs actualizados | `yarn test` dirigido (38 archivos) | 739 passed |
| H4.M3 | Compilación y suite completa del front | `yarn ng build --configuration production-api` · `yarn test --watch=false` | exit 0 · 10 534/10 535 (el restante, clasificado ENTORNO, pasa 10/10 con `CLINICAL_FORMS_DIR`) |
| H4.M4 | Recorrido visual sin delivery, móvil y escritorio | spec `pedido-farmacia-sin-delivery` | 2 passed |

## Evidencia visual (doble revisión)
- **Primera pasada:** alta de organización (éxito, error de sigla repetida, PDF falso, móvil, oscuro) y checkout sin delivery (3 pantallas, móvil y escritorio) abiertas como imagen y contrastadas con el criterio.
- **Segunda pasada, adversarial:** hallazgos **MENORES**, ninguno bloqueante: (1) en la alerta de error, el ícono queda en su propia línea sobre el texto (componente ajeno, preexistente); (2) las capturas de página completa duplican la cabecera fija a mitad de la imagen (artefacto de la captura); (3) el paso «Entrega» del checkout queda con una sola línea de contenido.
- **Nota por pantalla:** éxito claro/móvil/oscuro APROBADA · error de sigla APROBADA CON RESERVAS (1) · PDF falso APROBADA · checkout entrega APROBADA CON RESERVAS (3) · resumen móvil/escritorio APROBADA CON RESERVAS (2).

## No cubierto
- **Fidelidad ORM↔base** (`ORM_SCHEMA_SYNC=dry-run`) no se corrió: el cambio no toca el esquema, sólo inserta filas en tablas existentes.
- El front se probó con **Chromium**; no hay corrida cross-browser.
- El alta de laboratorio y de farmacia **no** se recorrió en navegador contra la API real (sólo aseguradora); comparten el mismo servicio de catálogos, verificado por API y por los int-specs.
- Imagenología es una maqueta sin llamadas a la red (sin cambio); no hay pantalla de hospital.
- No se corrió `yarn test` completo de la API (439 suites): lo hace CI; se corrieron las áreas vecinas.
- No se verificó el servidor de `test` desplegado: depende del merge y del redespliegue.

## Desvíos del plan
- H4 se adelantó a H2/H3 mientras la Mac estaba saturada por otras sesiones.
- Se agregaron al plan, por descubrimiento: el botón muerto (H3.M2), dos superficies de delivery más (`Confirmá tu pedido` y el perfil público de farmacia) y el spec visual (H4.M4).
- El kill-test se hizo borrando los 4 value sets en una base **descartable** para simular el servidor (documentado en `h2-kill-estado-base.txt`); no se edita ninguna base real.
- Un fallo de mi matriz fue expectativa mía mal deducida (404 vs 422 para un `fileId` inexistente en la vía anónima: el contrato es 422, `attachable-file.service.ts:213`) y otro, datos no únicos entre corridas; ninguno era del producto.

## Riesgos residuales
- Si una base ya cargó los 4 conjuntos desde el paquete del modelo, el seeder **no los toca** (otro id, mismo `internal_code`). Al revés —API primero, paquete después— el cargador del modelo chocaría con `uq_value_sets_internal_code`: queda pendiente del repo del modelo que adopte los ids de la API.
- Se conservó a propósito la **lectura** de pedidos antiguos con modalidad DOMICILIO/TRABAJO (bandeja de la farmacia, estado del pedido) y los campos del contrato de la API; la API y la base no se tocaron.
- La alerta de error y el paso de entrega vacío son deuda de diseño menor, anotada.

## Decisiones y ambigüedades
- Rótulos de los 4 catálogos con tildes derivados de cada código; el paquete del modelo los deja sin tildes. A confirmar con quien mantiene el modelo.
- «Toma de muestra a domicilio» de laboratorios y la modalidad «A domicilio» de las citas **no** son delivery de medicamentos: no se tocaron. A confirmar con el propietario.
- El «registro de procesos» pegado se usó sólo como contexto del alta de organización; no se construyó nada de esa lista.
- Entorno: se desarmó todo al terminar (0 contenedores, 0 volúmenes, sin procesos, `.env` sintético borrado).

## Pendiente
| Qué | Estado |
|---|---|
| Merge de los PR | **Hecho** el 2026-10-03: API #537 (test) y #538 (dev), front #869/#870 (test), #874/#875 (dev), #876/#877 (mockup) |
| Que `test` y `dev` vuelvan a compilar (`pdfMinimo`) | **Abierto**: front #884 (test) y #885 (dev); mientras no se mezclen, el servidor no recibe estos arreglos |
| Textos que insinuaban elegir cómo se recibe el pedido | **Abierto**: front #886/#887/#888 |
| Comprobar en el servidor que el alta ya no devuelve 422 | **Pendiente** del redespliegue y del arreglo de build; requiere crear una organización de prueba (visto bueno del propietario) |
| Cargador del paquete del modelo vs. seeder de la API (`uq_value_sets_internal_code`) | **Pendiente** en el repo del modelo |

## Actualización posterior al merge (2026-10-03)

Hechos comprobados con salida literal en `evidencia/`:

1. **Los 8 PR se mezclaron** (`evidencia/pr-estado.txt`: quién, cuándo y commit de merge).
2. **CI de la API sobre `dev` (#538): `docs` terminó en fallo** en «Pruebas unitarias con cobertura». **Es previo y ajeno**: mismo test (`insurance-controllers.spec.ts`, roles de solicitudes de seguro) y cobertura de ramas 68,65 % vs 68,63 % de una corrida de otro PR del 2/10, con umbral de 69 %. Detalle y comparación: `evidencia/ci-538-fallo-preexistente.txt`. Sobre `test` no hay CI configurado (el workflow dispara sólo sobre `master` y `dev`).
3. **CI del front: los 6 PR quedaron `queued` y se mezclaron sin que corriera.** La verificación que los respalda es la local; está guardada en el repo del front (`docs/frontend/evidence/2026-10-03-alta-org-y-sin-delivery/`).
4. **Hallazgo grave ajeno:** `test` y `dev` del front **no compilan** (`TS2304 pdfMinimo` en `clinical.handlers.ts`, dejado por los merges «integra los aportes locales de mockup»). Sin ese arreglo el despliegue falla en silencio. Ver el README de la evidencia del front.
5. **Corrección de este reporte:** donde decía `REGRESSION_VERIFIED` ahora dice `VERIFIED`. La segunda pasada visual la hice yo mismo (la regla lo prohíbe); se repitió con un revisor independiente, que dio veredicto global RECHAZADO (por causas ajenas al cambio). El veredicto visual es `VERIFIED_FUNCTIONAL_ONLY`.
