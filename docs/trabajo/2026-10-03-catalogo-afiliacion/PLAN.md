# Plan — La API siembra los catálogos de afiliación (alta de organización)

- Fecha: 2026-10-03 · Repos afectados: `mantra-core-health-api` (rama `justin/catalogo-afiliacion-seed-test`, base `test`); front en PR aparte · Predecesor: defecto D6 de `docs/progress/evidence/lane-M7-verif-h1-h2/REPORT.md`
- Resultado observable: en una base en frío (DDL + `seed-cli`, sin el paquete de seeds del modelo), `POST /iam/auth/register-organization` responde 201 en vez de 422 «El catálogo de documentos de afiliación no está disponible».
- Kill-test: base en frío + `seed:boot` + alta de una SRL con sus PDF → hoy 422 `PRECONDITION_FAILED` con `details.valueSet = VS_AFFILIATION_DOCUMENT_TYPE`.

## Alcance
- IN: seeder idempotente de `VS_AFFILIATION_DOCUMENT_TYPE`, `VS_ISSUING_AUTHORITY`, `VS_AFFILIATION_DOCUMENT_VERIFICATION_STATUS`, `VS_LEGAL_REPRESENTATIVE_ROLE` con los miembros del paquete del modelo; registro en la cadena de `seed-bootstrap`; specs; matriz de pruebas del alta por API y por navegador; documentación del cambio.
- OUT: `AffiliationDocumentConceptsService` y el contrato HTTP (no se tocan); DDL/`SQL/` (acá no se escribe DDL, ADR-0021); el paquete del modelo; quitar delivery (PR aparte del front); construir nada del «registro de procesos».
- Ambigüedades registradas:
  - Los rótulos (`display`) del paquete del modelo son el código «titulizado» sin tildes. El seeder usa el castellano con tildes derivado de cada código, sin agregar significado. Confirmar con quien mantiene el modelo si prefiere que el paquete adopte los mismos.
  - Si la base ya trae esos conjuntos del paquete del modelo (otro id, mismo `internal_code`), el seeder no los toca: el dueño ahí es el paquete.

## H1 — Seeder de catálogos de afiliación
**CA:** Dado una base con el esquema y sin los cuatro conjuntos, cuando corre `seed-cli`, entonces existen los cuatro con versión vigente y todos sus miembros, y una segunda corrida inserta 0 filas.
**DoD:** specs dirigidos en verde (`--maxWorkers=1`), `yarn typecheck`, `yarn lint`.
**Estado:** HECHO a nivel TESTED (specs con el ORM mockeado: no prueban la base real; eso es H2)

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H1.M1 | `affiliation-catalogs.catalog.ts`: 4 conjuntos, miembros del modelo, ids deterministas | cada código que exigen `affiliation-documents.ts` y `legal-representatives.ts` está en el catálogo | spec de cobertura de códigos → `evidencia/h1-specs.txt` 31/31 | HECHO |
| H1.M2 | `affiliation-catalogs-seed.service.ts` (una versión de sistema de códigos por conjunto) | 1.ª corrida crea; 2.ª = 0; conjunto ajeno existente se respeta | spec del servicio (mismo log) | HECHO |
| H1.M3 | Registrar en `seed-bootstrap.service.ts` y `seed.module.ts` + spec de pasos | el paso corre después de terminología y antes de cualquier uso | `seed-bootstrap.service.spec.ts` (mismo log) · `evidencia/h1-typecheck.txt` exit 0 · `evidencia/h1-lint.txt` exit 0 | HECHO |
| H1.M4 | README de `src/common/seed/` | la fila existe | `git diff src/common/seed/README.md` | HECHO |

## H2 — Reproducción en frío y matriz por API
**CA:** Dado una base en frío, antes del arreglo el alta da 422 y con el arreglo 201; cada rama de fallo del flujo responde el código documentado.
**DoD:** salidas literales en `evidencia/`.
**Estado:** HECHO

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H2.M1 | Stack local mínimo con topes de RAM, base en frío | Postgres sano, esquema aplicado | init exit 0 · 1 243 tablas · 0 value sets | HECHO |
| H2.M2 | Kill-test: alta sin los catálogos | 422 con `VS_AFFILIATION_DOCUMENT_TYPE` | `evidencia/h2-kill-test.txt` | HECHO |
| H2.M3 | Con el arreglo: `seed-cli` ×3 y alta | alta 201; 3.ª pasada 0 filas | `evidencia/h2-seed-*.log`, `h2-alta-tras-arreglo.txt` | HECHO |
| H2.M4 | Matriz por API (válido / límite / error) | una fila por `throw` del flujo | 32 PASS / 0 FAIL en `h2-matriz-api.resultado.md` | HECHO |
| H2.M5 | Int-specs del alta contra la base local | verdes | 2 suites · 16 tests · `h2-int-specs.txt` | HECHO |
| H2.M6 | Regresión de áreas vecinas (seeds, directorio, IAM) | verdes | 62 suites · 773 tests · `h2-unit-vecinas.txt` | HECHO |

## H3 — Recorrido de navegador contra la API real (repo front)
**CA:** Dado API y front en modo real-api, el alta de aseguradora termina en 201 y los casos límite y error responden lo documentado.
**DoD:** spec `registro-organizacion-api-real` verde con `E2E_API_REAL=1`, un solo worker.
**Estado:** HECHO

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H3.M1 | Spec de navegador contra la API real (válido / límite / error / visual) | 10 pruebas | 10 passed | HECHO |
| H3.M2 | Botón «Ir a iniciar sesión» muerto: faltaba importar `AppButton` (descubierto por la prueba) | falla sin el arreglo, pasa con él | 74/74 con · 1 falla sin | HECHO |

## H4 — Quitar delivery de la pantalla (repo front, rama `justin/sin-delivery-test`)
**CA:** Dado un paciente en el checkout de farmacia, no existe opción, paso ni texto de envío a domicilio; el pedido se crea siempre para retiro.
**DoD:** lint · typecheck · specs · build `production-api` · captura en móvil y escritorio con doble revisión.
**Estado:** HECHO

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H4.M1 | Sin delivery en checkout, «Confirmá tu pedido», diálogo, perfil público de farmacia, textos de registro y maqueta | 22 archivos | `git diff --stat` | HECHO |
| H4.M2 | Specs actualizados | sin referencias a símbolos borrados | 38 archivos · 739 tests | HECHO |
| H4.M3 | Build `production-api` y suite completa del front | exit 0 · 10 534/10 535 (1 de ENTORNO) | logs | HECHO |
| H4.M4 | Recorrido visual sin delivery, móvil y escritorio | 0 menciones en cada pantalla | spec `pedido-farmacia-sin-delivery`: 2 passed | HECHO |

## Riesgos y bloqueos previstos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| RAM de la Mac (16 GB, swap en uso) | Saturar y matar contenedores | topes por contenedor, un proceso pesado a la vez, freno por `memory_pressure` |
| Init en frío puede abortar (D5) | No se llega a la alta | se clasifica y se corrige sólo si bloquea |
| Carga del paquete del modelo sobre una base ya sembrada por la API | Choque por `internal_code` | anotado como pendiente del repo del modelo |
