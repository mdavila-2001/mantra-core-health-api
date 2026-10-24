# Reporte — Carril 03: correcciones del flujo de alta de paciente

- Fecha: 2026-10-23 · Plan: [PLAN.md](./PLAN.md) · Rama(s): `carril-03/alta-paciente` en `mantra-core-health-api` (base `dev`) y en `mantra-core-health` (base `mockup`)
- Peldaño de evidencia alcanzado: `VERIFIED` — camino real ejercitado en localhost contra la API real (Postgres, Redis y Mongo en Docker), persistencia comprobada en la base, consola sin errores propios.
- Avance: 17 / 17 microtareas HECHO (100 %)

## Completado
| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1 | `birthDate` fuera de 1910…hoy → 400 | jest DTO; POST real | `18 passed`; `fecha futura -> status: 400` |
| H2 | Correo sin dominio no crea la cuenta | vitest; Playwright | `PASS`; «Ingrese un correo válido.» visible |
| H3 | «+» de celulares y contactos de emergencia, guardados como filas reales | jest, vitest, Playwright (mock y real), `psql` | ver Evidencia |
| H4 | Suite e2e del alta al día con los 5 pasos | Playwright `--workers=1` | 11/11 contra API real, 17/18 de las suites tocadas contra mock (el que falla es laboratorio, preexistente) |

## A medias
ninguna

## Pendiente
| ID | Estado | Qué lo destraba |
|---|---|---|
| Zona en residencia y trabajo | BLOQUEADO | Columna en `common.addresses`: cambio en `mantra-core-health-model` |
| Nombres múltiples como colección | BLOQUEADO | Hoy sólo existe `profiles.persons.middle_name` (los extra se concatenan): cambio en el modelo |
| «Servicio de ambulancia» rotulado dos veces en el paso de contacto | TODO | Preexistente, fuera de alcance: lo anota este reporte |

## Evidencia
```
API — yarn test --maxWorkers=2 src/modules/iam src/modules/profiles
Test Suites: 52 passed, 52 total
Tests:       948 passed, 948 total
API — yarn typecheck → exit 0

FE — yarn ng test --include=register-patient/** --include=core/data-access/iam/**
Test Files  3 passed (3)
Tests  158 passed (158)
FE — yarn typecheck → exit 0

API real (localhost:3000) — scratchpad/api-real-check.mjs
catalogos: {"deps":9,"munis":200,"parentescos":9}
fecha futura -> status: 400
telefono extra invalido -> status: 400
alta completa -> status: 201
login -> status: 200
perfil -> telefono principal: +591 70012345

Base (psql) — teléfonos del paciente
 +591 70012345 | 1 | PHONE
 +591 71111111 | 2 | PHONE
 +591 72222222 | 3 | PHONE
Base — contactos de emergencia
 Luis Paz    | RELATIONSHIP_FATHER   | t | f | +591 74444444
 Marta Rojas | RELATIONSHIP_GUARDIAN | t | f |
 Rosa Quispe | RELATIONSHIP_MOTHER   | t | f | +591 73333333
Base — NIT
 1234567019 | Ana Paz

FE contra API real — E2E_API_URL=http://localhost:3000 yarn playwright test
  registro-empresa-y-mapa, registro-documento-ayuda, carril-03-alta-paciente: 11 passed
  registro-persistencia: 2 passed
```
Capturas: [correo sin dominio](./evidencia/carril-03-correo-sin-dominio.png), [alta completa](./evidencia/carril-03-alta-completa.png), [multicampos desktop](./evidencia/carril-03-multicampos.png), [multicampos 390 px](./evidencia/carril-03-multicampos-movil.png).

## No cubierto
- La regla de que el perfil lea el teléfono de menor `rank` se verificó leyendo `GET /profiles/patients/me` una vez; no se probó editar el teléfono desde el perfil después de un alta con teléfonos extra.
- Los contactos extra no se muestran todavía en «Mi perfil»: se guardan, pero esa pantalla no es de este carril.

## Desvíos del plan
- `playwright/auditoria-qa-mockup.spec.ts`: se corrigieron 3 errores de lint preexistentes (import `Page` sin uso y dos `Array<T>`), porque el archivo entra en el diff y sin eso el lint del PR falla.
- `api-contract.generated.ts` del FE: al regenerarlo desde el `openapi.json` de esta rama también entran rutas que ya estaban en `dev` y faltaban en `mockup` (959 → 966 operaciones). Es lo que indica `scripts/gen-mock-contract.mjs`.

## Riesgos residuales
- Un cliente que hoy mande una fecha futura recibe 400 donde antes recibía 201. El frontend ya la limitaba.
- Un contacto extra sin parentesco se guarda como `RELATIONSHIP_GUARDIAN`, igual que el primero (comportamiento existente de `createGuardianRelatedPerson`).

## Fallos preexistentes encontrados (no son de este carril)
Verificados corriendo los mismos tests sin los cambios de este carril (`git stash`): fallan igual.

| Repo | Test | Qué falla | Autor | Commit | Entró por |
|---|---|---|---|---|---|
| API | `src/common/filters/error-traceability.http.spec.ts` | Espera `/` en la ruta; en Windows llega `\\`. Sólo falla en Windows | Pablo Arauz Caballero | `cf2255f5` (2026-10-08) | PR #595 (`justin/error-traceability`) |
| API | `src/common/seed/glossary-articles.catalog.spec.ts` | `hipertension-arterial` tiene 1.892 palabras; el piso es 2.000 | Commit «Claude» en rama de Marcelo | `fff35d24` (2026-10-12) | PR #649 (`claude-marcelo/optimistic-keller-hu6572`) |
| API | `src/common/audit-trail/audit-trail-coverage.spec.ts` | `PUT /community/ratings` sin `@Audited`/`@NotAudited` | Pablo Arauz Caballero | `80a1bcf0` (2026-10-10, «work in progress») | rama `justin/mesh-ratings` |
| FE | 8 archivos, 73 tests (66 en `medication-block.spec.ts`) | ajenos al alta | — | — | ya fallaban en `mockup` |
| FE | `playwright/altas-sin-cobertura.spec.ts` › laboratorio | ajeno al alta | — | — | ya fallaba en `mockup` |

## Segunda vuelta (pedidos de Leo, 2026-10-24)

| Qué | Dónde | Verificación |
|---|---|---|
| `app-select` con panel propio en **toda la app**; la caja «Buscar» sólo con 11 opciones o más | `shared/components/atoms/select` | vitest 144/144 (select + alta); Playwright: Sexo y Departamento sin buscador, mouse y teclado (flechas + Enter) eligen |
| «+ Agregar…» como botón con borde (`secondary`), en su fila al final del bloque (nombres, celulares, contactos) | `register-patient.html/.css` | captura `carril-03-boton-agregar-nombre.png` |
| Fecha de nacimiento: mínimo **1910-01-01**, máximo **hoy** calculado al momento (no un año fijo) | FE `minDate`/`maxDate: 'today'`; API `BIRTH_DATE_MIN` + `IsBirthDateInRange` | jest con reloj simulado en 2027-03-01: acepta 2027-02-01 y rechaza 2027-03-02; navegador: 1909 deshabilitado, 1910 habilitado, 2026 habilitado, 2027 deshabilitado |
| Contrato del mock: sólo se agregan `additionalPhones` y `additionalEmergencyContacts` a `RegisterPatientDto` | `api-contract.generated.ts` | regenerarlo entero desde `dev` arrastraba 7 operaciones ajenas que rompían 2 specs del mock en `mockup`; se regenera completo cuando `mockup` se sincronice con `dev` |
| Tests de `location-picker` y gate de a11y al día con el select nuevo | `location-picker.spec.ts`, `select.html` (sin `aria-invalid`/`aria-required` en el botón) | axe sin violaciones |

Suite completa del FE: 75 fallos **con y sin** los cambios de este carril (mismas suites; `pdf-logo`, `clinical.handlers` e `insurance-analytics.handlers` alternan por orden de ejecución). Ningún fallo nuevo.
e2e del alta contra mock: 28/29 (el que falla es laboratorio, preexistente).
Lint preexistente fuera del diff: `select.spec.ts` (2× `prefer-on-push`).

## Decisiones y ambigüedades
- Orden de páginas: queda el de Pablo (`2ecfebbb1`). Decisión de Leo, 2026-10-23.
- Departamento de emisión: queda obligatorio (`b300adebb`). Decisión de Leo, 2026-10-23.
- Topes del «+»: 4 celulares y 4 contactos extra, iguales en DTO y FE.
- Se compara la fecha por día UTC (`YYYY-MM-DD`): en Bolivia (UTC-4) nacer hoy siempre es válido.
