# Reporte — C6 tratamientos por enfermedad (cierre de huecos de terminología)

- Fecha: 2026-10-28 · Plan: [PLAN.md](../../PLAN.md) (H1.C6.M1–M5) · Rama: `claude/adoring-heisenberg-1rl29k`
- Peldaño de evidencia alcanzado: `TESTED` para parsers y corpus versionado; `VERIFIED` solo para la carga idempotente **en un Postgres 16 desechable** (no en la base del stack). No es `REGRESSION_VERIFIED`: sin revisión independiente.
- Avance: 4 HECHO / 5 microtareas = 80 % (M3 queda A MEDIAS)

## Completado
| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1.C6.M1 | Re-sondeo de hoy de los hosts de la tabla de huecos | `curl` por host | [resondeo-hosts-2026-10-28.txt](resondeo-hosts-2026-10-28.txt): 13 de 19 en 200; 301/302 en civicdb, whocc, ctdbase; sin respuesta minsalud.gob.bo y api.pharmgkb.org |
| H1.C6.M2 | `node --test` del dominio | `node --max-old-space-size=2000 --test tools/terminology-import/drug-treatments/test/*.test.mjs` | `# tests 27 # pass 27 # fail 0` ([revalida-node-test.txt](revalida-node-test.txt)) |
| H1.C6.M4 | Carga `--apply` en Postgres 16 desechable (puerto 55436), 2.ª corrida idempotente | `load-drug-treatments.mjs --apply` ×2 con `DB_*` explícito | 1.ª: 341 065 conceptos (341 019 afirmaciones + 46 tipos), 6 073 333 propiedades, 265 s. 2.ª: `concepts 0 / properties 0 / relationships 0` en los 15 code systems ([revalida-carga-1.txt](revalida-carga-1.txt), [revalida-carga-2.txt](revalida-carga-2.txt)). Integridad: huérfanos 0, duplicados 0, nulos 0, procedencia HTTP sin release/URL 0 ([revalida-verify-load.txt](revalida-verify-load.txt)) |
| H1.C6.M5 | Doc `docs/seed-research/drug-treatments.md` con §0 (hueco → hoy → cargado, antes/después) y nota de superación en §5; `SOURCES.md` ya registraba licencias | diff del doc | 18 032 → 341 019 afirmaciones; afirmaciones con ATC 0 → 228 242 |

También: `validate-links.mjs` corrió (exit 0; [validate-links.txt](validate-links.txt)).

## A medias
### H1.C6.M3 — Build reproducible
- Qué anda: `sha256sum -c SHA256SUMS` OK en los 22 archivos y `gzip -t` OK en las 19 partes ([revalida-sha256-gzip.txt](revalida-sha256-gzip.txt)); `build-sha256.txt` del WIP muestra el mismo hash en dos builds.
- Qué no anda: hoy no repetí el build; los crudos se borraron y rebajarlos (MED-RT, ChEMBL, DrugCentral, Open Targets, MeSH) cuesta disco y red que el brief pide cuidar.
- Qué falta exactamente: correr `fetch-sources.mjs` + `fetch-open-sources.mjs` + `build-drug-treatments.mjs` dos veces y comparar con `SHA256SUMS`. Las fuentes en vivo (Wikidata, ClinicalTrials, EMA, CIViC) pueden haber cambiado desde el 2026-10-27, así que un hash distinto no sería un error.
- Dónde quedó: corpus versionado en `tools/terminology-import/drug-treatments/data/`.

## Pendiente
| ID | Estado | Qué lo destraba |
|---|---|---|
| Enlace fármaco/enfermedad contra catálogos reales | TODO | Una base con `rxnorm_full`, `mesh`, `mondo`, `icd10cm`, `vademecum` cargados; la desechable no los tiene |
| CTD, NCATS Inxight, PharmGKB | TODO | Leer la licencia de cada una (CTD y Inxight responden hoy; PharmGKB no) |
| Revisión independiente (`regression-auditor`) | TODO | Otro agente, solo lectura |

## Evidencia
- `# tests 27 / # pass 27 / # fail 0`.
- 2.ª carga: 15 bloques `"concepts": 0, "properties": 0, "relationships": 0`.
- `validate-links`: `drugsTotal 21668, drugsWithCatalogMatch 0`. Es esperado con una base sin catálogos: mide el mecanismo, no la cobertura.
- Cobertura ATC antes/después: `cobertura-atc-antes.json` / `cobertura-atc-despues.json` (0 → 228 242 afirmaciones con ATC; 5 466 de 21 668 fármacos de un ingrediente; 5 315 códigos distintos).

## No cubierto
- Relaciones estructurales `assertion:drug` / `assertion:condition`: **0** en esta corrida por falta de destinos. La cifra de 988 162 / 610 619 de `verify-load-1.txt` (WIP, con MeSH/MONDO/ATC parciales sembrados desde crudos ya borrados) **no se reprodujo hoy**.
- Rendimiento y consumo de la API/UI de estos datos; el `/glossary` no los muestra (decisión de producto).
- Sin aplicar el DDL `90_fk_deferred.sql` (requiere esquema `iam`, ausente en la base desechable).
- Sin parche SQL de evidencia de relaciones (`mantra-core-health-model` no existe en esta máquina): no hace falta, las afirmaciones son conceptos con propiedades. No se escribió DDL.

## Desvíos del plan
- Se corrigió `test/drug-treatments.test.mjs` (mi ruta): (a) leía las 341 019 filas juntas y abortaba por heap con `--max-old-space-size=2000` (SIGABRT); ahora procesa una parte por vez, con las mismas aserciones; (b) exigía `commit` también a las filas HTTP, que por diseño no tienen commit; ahora exige `commit` si hay `repo`, y `release` + `fileUrl` si no. No se debilitó ninguna aserción para las filas de GitHub; se añadió `license` a las exigidas.

## Riesgos residuales
- Las fuentes en vivo no están versionadas por la fuente (Wikidata, ClinicalTrials, CIViC): lo versionado es el normalizado.
- UMLS CUI guardados como identificadores (ver §8 del doc).
- Polaridad: un consumidor que ignore `assertion_polarity` mostraría 223 219 «en investigación» y 38 643 negativas como tratamiento.

## Decisiones y ambigüedades (para el propietario)
1. **ChEMBL (CC BY-SA 3.0) y DrugCentral 2027 (CC BY-SA 4.0)**: cargados en code systems propios, retirables por code system. No hay precedente en el repo; la decisión de mantenerlos es del propietario.
2. MED-RT sin aviso de licencia en el paquete: tratado como obra del VA; confirmar.
3. Códigos ATC (no nombres ni DDD): confirmar que el código se puede guardar; si no, filtrar `system='ATC'`.
4. eEML (CC BY 3.0 IGO): atribución obligatoria.
5. WHO ATC no se carga. Sin SNOMED CT, DrugBank, KEGG ni fuentes NC.
