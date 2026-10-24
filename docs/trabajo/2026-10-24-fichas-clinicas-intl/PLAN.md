# Plan — Fichas clínicas: ampliación con estándares internacionales

> **Plan escrito después de ejecutado el trabajo.** `AGENTS.md` §2.1 exige el plan en disco antes
> de la primera línea de código; en esta sesión no se leyó `AGENTS.md` durante el discovery (sólo
> se buscó `CLAUDE.md`, que no existe) y el plan se reconstruyó al cierre a partir de los commits.
> Queda registrado como desvío en el [reporte](./REPORTE.md). Los estados reflejan lo verificado.

- Fecha: 2026-10-24 · Repos afectados: `mantra-core-health-api` · Predecesor: PR #563 / #564 (fichas NNAC 2012 y 2025)
- Resultado observable: un profesional que abre el selector de fichas encuentra las escalas internacionales itemizadas (Apgar, SOFA, NIHSS, HEART…) y las listas de las DAK de la OMS en las fichas de su especialidad, cada campo con su fuente citada; cuatro condiciones sin ficha (colitis ulcerosa, ITS, vacunación/ESAVI, biopsia de próstata) la tienen.
- Kill-test: `node tools/clinical-forms/build-forms.mjs --check` falla, o una ficha nueva no aparece en `STANDARD_FORMS`, o la segunda siembra contra Postgres crea plantillas.

## Alcance
- IN: `src/common/seed/data/clinical-forms/`, `tools/clinical-forms/`, `docs/seed-research/clinical-forms.md`, este directorio.
- OUT: `ClinicalFormsSeedService` y su spec (sólo se ejecutan), `database/`, el repo del modelo, las fichas NNAC, las fichas SRQ-20/AUDIT escritas a mano, `glossary-articles.catalog.spec.ts` (en rojo en `dev`).
- Ambigüedades registradas:
  1. Rama: el brief pide `justin/seed-clinical-forms-intl`; la sesión tiene asignada `claude/intelligent-johnson-q0ll9g` con orden de no empujar a otra. Supuesto: la de la sesión. Confirmar: Justin.
  2. PHQ-9 / GAD-7: el CKM cita permiso de reproducción de los autores, pero el README y `catalog.spec.ts` exigen permiso escrito para uso comercial. Supuesto: no se incorporan. Confirmar: propietario.
  3. Escalas sin términos de licencia publicados (HAS-BLED, SOFA, HEART…): supuesto, entran como categorías clínicas, el criterio ya vigente en `fuentes.mjs`. Confirmar: revisión legal.
  4. Material OMS CC BY-NC-SA 3.0 IGO (no comercial), igual que el ya presente en el catálogo. Confirmar: revisión legal.

## H0 — Generador en verde sobre `dev`
**CA:** Dado `dev`, cuando se corre el generador en modo comprobación, entonces termina en 0 sin tocar las fichas escritas a mano.
**DoD:** `node tools/clinical-forms/build-forms.mjs --check` → `370 fichas … 0 desactualizadas`, exit 0.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H0.M1 | Lista `A_MANO` en `build-forms.mjs` | `--check` deja de fallar por `PSIQ_AUDIT_TAMIZAJE` | `build-forms.mjs --check` → exit 0 | HECHO |

## H1 — Escalas del CKM de openEHR (pasadas 1, 5, 7 y 8)
**CA:** Dado el espejo del CKM, cuando se arma el catálogo, entonces cada escala nueva aparece itemizada en su ficha, cita publicación, arquetipo y licencia, y marca su traducción.
**DoD:** `build-forms.mjs --check` exit 0 · `catalog.spec.ts` «ampliación internacional» en verde.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H1.M1 | Lector ADL (`openehr/adl.mjs`) | Lee ordinales y términos es/en de `apgar.v2` | `extract-ckm.mjs` → `21 arquetipos` | HECHO |
| H1.M2 | Instantánea `ckm-snapshot.json` con commit | Regenerable desde cero, idéntica | `fetch-sources.sh` → `git status` sin cambios | HECHO |
| H1.M3 | Pasada 1: 10 fichas + colitis ulcerosa | Campos presentes con «Fuente:» | spec «cada campo de una escala del CKM…» | HECHO |
| H1.M4 | Pasada 5: HEART, ABCD², Downton, PADSS, Tanner | ídem | ídem | HECHO |
| H1.M5 | Pasada 7: reflejos, NRS 2002, Beighton, biopsia de próstata | ídem | ídem | HECHO |
| H1.M6 | Pasada 8: Ferriman-Gallwey | ídem | ídem | HECHO |

## H2 — DAK de la OMS (pasadas 2, 3 y resultado de TB)
**CA:** Dado los diccionarios de las DAK, cuando se arma el catálogo, entonces cada lista nueva cita el elemento de datos, la licencia y lleva el descargo de la OMS.
**DoD:** spec «todo campo de una DAK… lleva el descargo» en verde.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H2.M1 | Extractor `who-dak/extract-dak.py` + `dak-snapshot.json` | Regenerable desde cero, idéntica | `fetch-sources.sh` → `{'PNC': 24, 'HIV': 14, 'FP': 5, 'ANC': 1, 'IMMZ': 8}` | HECHO |
| H2.M2 | Puerperio, recién nacido, VIH, planificación, prenatal, TB | Campos presentes con descargo | spec del descargo | HECHO |
| H2.M3 | Fichas nuevas ITS y vacunación/ESAVI | En `STANDARD_FORMS` | spec «las fichas nuevas existen» | HECHO |

## H3 — HL7 IPS en la epicrisis (pasada 4)
**CA:** Dado la epicrisis, cuando se arma, entonces tiene las secciones del IPS que faltaban y ningún value set SNOMED.
**DoD:** spec «no se cuela ningún código ni value set de SNOMED CT» en verde.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H3.M1 | Secciones IPS en `TRANSV_EPICRISIS` (v3) | 7 secciones nuevas, sin SNOMED | spec SNOMED en verde | HECHO |

## H4 — Saturación
**CA:** Dado el registro de pasadas, cuando dos seguidas aportan 0, entonces el bucle se cierra y se documenta por qué.
**DoD:** tabla de pasadas en `docs/seed-research/clinical-forms.md` con 9 y 10 en 0 y sus motivos.
**Estado:** HECHO (la 10 es 0 por bloqueo de red: `evidencia/hosts-bloqueados.txt`)

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H4.M1 | Registro de 10 pasadas con fuentes, aportes y descartes | Tabla presente, 9 y 10 en 0 | `grep -c '^| [0-9]* |' docs/seed-research/clinical-forms.md` | HECHO |

## H5 — Verificación y entrega
**CA:** Dado el catálogo final, cuando se siembra dos veces contra un Postgres con el DDL real, entonces la segunda corrida no crea nada; y los gates del repo pasan.
**DoD:** `evidencia/siembra-postgres.txt` (`second: {templates: 0}`) · `evidencia/specs-dirigidos.txt` (49/49) · `evidencia/typecheck-lint.txt` (exit 0) · `evidencia/build-forms-check.txt` · PR contra `dev` sin mergear.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H5.M1 | Specs dirigidos | 49/49 | `yarn test catalog.spec.ts clinical-forms-seed.service.spec.ts` | HECHO |
| H5.M2 | Siembra e idempotencia | 2.ª corrida 0/0 | spec temporal de integración | HECHO |
| H5.M3 | typecheck + lint | exit 0 | `evidencia/typecheck-lint.txt` | HECHO |
| H5.M4 | Descarga reproducible de crudos | sha256 verificados | `fetch-sources.sh` → `>>> sha256 verificados` | HECHO |
| H5.M5 | Subir de versión desde una base de `dev` contra Postgres | Fichas reconciliadas | — | DESCARTADO (cubierto por spec unitario; ver reporte) |
| H5.M6 | `yarn test` completo, `docs:validate`, `docs:build` | — | — | TODO (no corridos; ver reporte) |

## Riesgos y bloqueos previstos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| Red sólo GitHub + npm | Sin guías nacionales ni NNAC 15–24 | Fuentes en GitHub congeladas; hueco documentado |
| Arquetipos «en desarrollo» con errores | Criterio clínico equivocado | Contraste con la publicación; correcciones citadas en la ayuda |
| Licencias SA y NC | Uso comercial | Licencia por campo en la ayuda; revisión legal pedida |
