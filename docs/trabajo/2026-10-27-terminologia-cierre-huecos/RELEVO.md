# RELEVO — Cierre de huecos de terminología (2026-10-28)

Para la IA que retoma. Leé esto, luego `PLAN.md` y `BRIEF-COMUN.md` (mismo directorio) y `AGENTS.md` del repo. Repo: `mantra-core-health-api`, rama `claude/adoring-heisenberg-1rl29k`. Idioma: castellano rioplatense.

## La orden del usuario (palabras suyas, resumidas)
"Cargar absolutamente todos los términos de terminología; está muy mala; no sé cuántos faltan. Lanzar agentes en paralelo, lo más rápido posible." Interpretación acordada: cargar a `terminology.*` todo lo que las fuentes **abiertas y con licencia verificada** permitan, con procedencia por fila; lo demás queda declarado como hueco de licencia/acceso para decisión del propietario. No se inventa nada.

## Por qué hay relevo
La sesión anterior corrió 13 agentes a la vez en una máquina de 4 CPU / 15 GB: carga 8, disco al 96 %, y todos los agentes terminaron `killed` al interrumpirse la sesión (también quedaron procesos huérfanos, ya detenidos). Se hizo un commit de checkpoint (`b6cb272d`) con todo el árbol de trabajo: **es trabajo en curso, no verificado como conjunto**.

## Descubrimiento clave
Las sesiones del 2026-10-24 estaban bloqueadas por 403; el 2026-10-27 sí hubo salida a CIMA, RxNav, openFDA, Wikidata, EVS/NCI, Zenodo, NCBI, ClinicalTrials, DrugCentral. `loinc.org` 403, `minsalud.gob.bo` sin respuesta. Re-sondeá cada host antes de asumir.

## Estado por carril (de `git log`; sin reportes finales salvo C2 y C8)
| Carril | Dominio / ruta | Estado |
|---|---|---|
| C1 | enfermedades `diseases/` | lectores MeSH oficial, NCIt EVS, GARD, NANDO, OncoTree, CIE-11 ES (7423d61c). Faltan: corrida completa, carga idempotente, doc, reporte |
| C2 | síntomas `symptoms/` | **cerrado con reservas** (reporte final en `evidencia/C2/REPORTE-C2.txt`). Revisión independiente: PASS con reservas. Correcciones pedidas y **sin confirmar si aterrizaron** (ver abajo) |
| C3 | laboratorio + procedimientos | GTR 63 914, DICOM CID 29, RadLex Playbook, TUSS/PAMI cotejados, ICD-10-PCS FY2027 (79 256), MeSH E y ClinicalTrials (d371977c). Faltan: CUPS/México/SUS, carga idempotente final, docs, reporte |
| C4 | alergias `allergies/` | cambios sin reporte; hay builds y cargas en `evidencia/C4/`. Falta cierre |
| C5 | farmacología clínica | validada contra CIMA/RxNav/openFDA; subsecciones CIMA, EMA (3974ebef). Falta: pasada exhaustiva openFDA/CIMA, carga, pack-data, reporte |
| C6 | tratamientos por enfermedad | MED-RT, ChEMBL, DrugCentral, Wikidata, eEML, EMA, Open Targets, ClinicalTrials, CIViC + cruces ATC (77a957dc). Faltan: validate-links, doc, reporte |
| C7 | diccionarios `dictionaries/` | solo sondeo + `import-wikidata-es-labels.mjs`, `taxdump.mjs` en curso. Falta casi todo |
| C8 | enfermería + especialidades | **cerrado con reservas** (`evidencia/C8/REPORTE-C8.md`) |
| C9 | glosario ES + enciclopedia | importadores ES corridos (`evidencia/C9/01..04`); falta tabla de auditoría y propuesta de producto |
| C10 | equipos de diagnóstico | `us/eu/row` con `out/` cargados (hc-mdall, anvisa, eudamed…), `master/build.mjs` quedó cortado |
| C11 | `interop-vocab/` (HL7/FHIR, UCUM, CVX/MVX, ISO) | recién empezado (fetch + lib) |
| C12 | `genetics/` (HGNC, NCBI Gene, ClinVar vocab, SO) | recién empezado; `evidencia/C12/PLAN-C12.md` |
| C13 | `nutrition-foods/` (USDA FDC, FoodOn…) | recién empezado |

## Pendientes ya identificados por la revisión independiente (C2 y C8)
Sin bloqueantes. Corregir (verificar con `git log`/diff si ya aterrizó):
1. **Licencias**: Omaha figura `loadable:true` aunque su FAQ pide contactar a la editorial a quien vende software; Glasgow `verified-free` con un permiso solo para "clinical care and clinical research at no cost" y filas de un arquetipo CC BY-SA. Dejar ambos NO cargables por defecto (flag explícito de aprobación del propietario). HPO: cláusula "uso no comercial" del sitio, igual.
2. CMDIC: 617 filas con `official-publication-license-not-stated` vs docs que dicen "confirmada" (`nursing-care/lib/msssi.mjs:68`, test `nursing-care.test.mjs:198`).
3. SHA-256 no reproducible por `retrievedAt` (Omaha, specialty-services); evidencia de carga de specialty-services vencida.
4. C2: falta SHA-256 de entrada por fila en `relations-orphadata`, `crosswalk-wikidata-hpo`, `crosswalk-medgen-cui`; Wikidata en vivo sin versionar; licencias NCIt/MeSH/Orphadata sin captura textual; `symptoms/lib/sources.mjs:108` dice "reconfirmar".
5. `specialty-services/build-specialty-services.mjs` reescribe `data/` versionada por diseño (agregar `--out`/guard); los `fresh-db.sh` hacen `drop database` por variable de entorno (guard).
6. `tools/terminology-import/diagnostic-devices/node_modules` quedó sin versionar a propósito: no lo commitees; revisá por qué existe.

## Reglas que no se negocian
`BRIEF-COMUN.md` las lista (verbatim, procedencia por fila, licencias, sin DDL, parsers contra archivo real, rutas propias, `data/` en partes < 45 MB, Postgres desechable idempotente, escalera de evidencia sin "listo" sin evidencia, quien implementa no se aprueba). Más:
- **Recursos**: ≤ **4 agentes a la vez**, no 13. Disco justo: borrá cada crudo al normalizarlo; Postgres desechable en `/var/tmp/pg-<carril>` (el usuario `postgres` no entra al scratchpad; para pararlos como root: `runuser -u postgres -- pg_ctl -D … stop`), y borralo al terminar.
- Un `rm -rf`/`pkill` masivo sobre el scratchpad fue bloqueado por el clasificador de permisos de la sesión anterior; no lo eludas, pedí permiso.
- Git: rama indicada, `git add` con rutas explícitas, commits por pasada, sin PR salvo pedido expreso. Un agente por ruta para no pisarse.
- Todo cambio de producto (p. ej. que `/glossary` muestre lo importado: hoy `ConceptsService.searchConcepts` acota a 64 términos curados) es **decisión del propietario**: proponer diff, no aplicar.

## Qué falta hacer (en orden)
1. Liberar disco y verificar `git status` limpio. Re-sondeo rápido de hosts.
2. Revalidar el árbol WIP por carril: `node --test` del dominio, `gzip -t`, SHA-256 contra `SHA256SUMS`, carga en Postgres desechable con 2.ª corrida = 0 filas nuevas.
3. Terminar C1, C3, C4, C5, C6, C7, C9, C10, C11, C12, C13 (de a 4 agentes), cada uno con `REPORTE-<carril>.md`.
4. Aplicar las correcciones de la sección "Pendientes".
5. Revisión independiente (agente tipo `regression-auditor`, solo lectura) de cada carril cerrado, distinta de quien lo implementó.
6. Escribir `REPORTE.md` consolidado (regla 40: **AVANCE x / y en la primera línea**, Completado / A medias / Pendiente, No cubierto, decisiones), actualizar `PLAN.md`, commit y push.
7. Dominios no lanzados (ideas): ICD-9-CM y clasificaciones CMS/NCHS de dominio público, UNII/GSRS y listas SPL (formas, vías), microbiología/antimicrobianos.

## Decisiones del propietario acumuladas
Open Food Facts (ODbL); HPO uso no comercial y atribución; Omaha en producto comercial (Health Connections Press); Glasgow; NEWS2 (RCP prohíbe modificar); `cups-co` copias vs oficial; "Procedimiento del PBS" CC BY-SA 4.0; TUSS/SIGTAP en portugués; cruces MedGen por CUI; `mesh-c23` propio vs dentro de `mesh`; concepto `REL_SYMPTOM_EXCLUDED` ausente en `concepts.ts`; `desc2026.zip` re-publicado (SHA-256 distinto al del manifiesto del repo del modelo); especialidades faltantes en el modelo (Neurocirugía 266, Cirugía Plástica 205+66, Cardiovascular/Tórax 192, Medicina Nuclear/Radioterapia 43, Mastología 36…, y profesión vs especialidad); ChEMBL/DrugCentral CC BY-SA. Sin licencia no se cargan: SNOMED CT, CPT, MedDRA, DeCS, ATC/DDD de la OMS, NANDA/NIC/NOC, LOINC completo, CIE-11 (CC BY-ND y API con cuenta), Braden/Barthel/Waterlow/MUST. Alerta: `cenetec-difusion.com` sirve hoy una página de casinos.
