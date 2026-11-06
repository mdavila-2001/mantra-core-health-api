# Reporte — Repositorio universal de servicios: buscar e importar, sin alta libre

- Fecha: 2026-11-01 (iniciado 2026-10-27, cortado por el límite semanal de uso) · Plan: [PLAN.md](./PLAN.md) · Rama: `claude/repositorio-universal-servicios`
- Peldaño de evidencia alcanzado: `VERIFIED` para la API (camino real HTTP + Postgres + persistencia); `TESTED` para el cargador. No `REGRESSION_VERIFIED`: no se corrió la suite de integración completa.
- Avance: 7 / 10 microtareas HECHO (70 %).

## Completado
| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1.S1.M1 | Búsqueda sin acentos, multi-palabra, por especialidad y fuente | `yarn test:integration test/integration/service-repository.int-spec.ts` | 7 passed |
| H1.S1.M2 | `GET /billing/service-catalog/repository` y `/repository/facets` | ídem | 7 passed |
| H1.S2.M1 | `POST /billing/service-catalog/import`, idempotente por concepto | ídem + `yarn test src/modules/billing` | 7 passed · 140 passed |
| H1.S2.M2 | `POST /billing/service-catalog` sin `serviceConceptId` → 422 `SERVICE_CATALOG_CONCEPT_REQUIRED` | ídem | 7 passed |
| H2.S1.M1 | Cargador idempotente `tools/terminology-import/service-repository/` | `load-service-repository.mjs --apply` ×2 | 2.ª corrida: 0 filas |
| H2.S1.M2 | Adaptadores PBS Colombia (8 114), FONASA completo (2 515), PAMI (4 681) | `build-service-repository.mjs` | 15 882 registros |
| H2.S1.M3 | Listas de control con cita → 572 servicios curados + 758 adjuntos a CUPS/FONASA | `node --test "tools/terminology-import/service-repository/test/*.test.mjs"` | 5 pass |

## A medias
### H2.S2.M2 — Listas de control por grupo de especialidades
- Qué anda: Odontología (705 ítems citados, 11 especialidades del modelo + 7 propuestas) y Mujer/niño/neuro/mente están completas y cargadas.
- Qué no anda: Cardio/respiratorio/críticos, Medicina clínica, Quirúrgicas y Diagnóstico/afines se cortaron por el límite semanal de uso **antes de escribir su JSON**.
- Qué falta exactamente: rehacer esos 4 grupos con el mismo formato (ver prompts en el historial de la sesión; formato en `investigacion/checklists/odontologia.json`). Por eso **Cardiología sigue en 104 servicios etiquetados**: sus servicios están en el buscador (CUPS/FONASA/PAMI), pero sin etiqueta de especialidad.
- Dónde quedó: `investigacion/checklists/`.

## Pendiente
| ID | Estado | Qué lo destraba |
|---|---|---|
| H2.S2.M1 | TODO | Escribir los adaptadores de PDF siguiendo `ADAPTERS.md`; las fuentes están descargadas con SHA-256 (fuera de git, en `../servicios-build/sources/` del contenedor — **se pierden si se recicla**: las URLs y hashes están en `investigacion/fuentes/fuentes.json`). |
| H3 | BLOQUEADO | Pantalla «Mis servicios» (buscador + importar) en `mdavila-2001/mantra-core-health`: el permiso para agregar ese repo a la sesión fue denegado. |

## Evidencia
- `evidencia/integracion-service-repository.txt` — `Tests: 7 passed, 7 total` contra Postgres 16 local sembrado (28/28 seeds) con el repositorio completo cargado.
- `evidencia/typecheck.txt` — `TYPECHECK EXIT 0`.
- `evidencia/carga-1.txt`, `evidencia/carga-2-idempotente.txt` — 14 737 conceptos, 17 153 designaciones, 55 878 propiedades, 345 relaciones, 15 882 miembros; segunda corrida: todo 0.
- `evidencia/tests-cargador.txt` — 5 pass.
- `evidencia/cobertura-base-local.txt` — **20 290 servicios importables** (antes ≈5 556: 4 408 BO + 1 148 por especialidad).
- `evidencia/cobertura-antes-despues.md` — por especialidad con las 63 del modelo. Ej.: Endodoncia 17→62, Periodoncia 21→60, Implantología 0→38, Ortodoncia 3→29, Odontopediatría 17→54, Neonatología 4→36, Oncología ginecológica 0→30, Psicología clínica 15→53.
- Contrato: `check-breaking.mjs` → «Sin cambios incompatibles no aprobados» (la ruptura del alta está registrada en `tools/openapi/breaking-changes-exceptions.json`).

## No cubierto
- Suite de integración completa (regresión) y e2e: no se corrieron.
- La base local tiene 34 de las 63 especialidades (no está el paquete del modelo): las relaciones con las otras 29 (dentales, pediátricas) se resolverán recién al cargar en una base con `VS_MEDICAL_SPECIALTY` completo; acá se midieron desde el corpus.
- `inventario:endpoints` no se regeneró: exige el repo del modelo (`MODEL_ROOT`).

## Desvíos del plan
- Bug encontrado y corregido en el camino: los conceptos FONASA/CUPS tienen ids md5 que `@IsUUID()` estricto rechazaba (400 al importar). Se usa `@IsUUID('loose')` en `conceptId` y `serviceConceptId` (verificado en `class-validator` 0.15.1 instalado) con spec propio.
- 9 subagentes (4 de listas, 4 de PDFs, 1 parcial) cortados por límite de uso; por pedido de ahorro no se relanzaron.

## Riesgos residuales
- **Licencia CC BY-SA 4.0** de las definiciones PBS (ver `tools/terminology-import/service-repository/SOURCES.md`).
- El front actual que llame al alta de texto libre recibe 422 hasta que se haga H3.
- `PATCH /billing/service-catalog/:id` sigue permitiendo renombrar un servicio (el enlace al concepto se conserva).

## Decisiones y ambigüedades
1. «No se debe permitir crearlo» se aplicó a **todos** los roles, incluida la administración. El servicio interno `CITA_MEDICA` no pasa por el endpoint y sigue. Confirmar con producto.
2. Código de un servicio importado: `<sistema>:<código>` (p. ej. `cups-co:881234`).
3. CIE-10-ES Procedimientos (78 948) **no** se cargó al repositorio de la tienda: nombres técnicos, se recomienda como capa de mapeo.
4. Especialidades que las fuentes nombran y el modelo no tiene (Gerodontología, Fonoaudiología, Medicina reproductiva…): se guardan como `proposedSpecialty`, sin relación. Proponerlas en `mantra-core-health-model`.
5. ¿Se acepta CC BY-SA para las definiciones? Supuesto: sí, internamente; confirmar con legal.
