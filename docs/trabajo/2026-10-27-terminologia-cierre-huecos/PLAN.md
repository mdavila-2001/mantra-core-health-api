# Plan — Cierre de huecos de terminología (carga exhaustiva de términos)

- Fecha: 2026-10-27 · Repos afectados: `mantra-core-health-api` (tools/terminology-import, docs/seed-research) · Predecesor: pasadas `docs/seed-research/*.md` del 2026-10-24 (bloqueadas por 403 de red)
- Resultado observable: cada dominio de terminología tiene cargados (en `terminology.*`, probado en un Postgres 16 desechable) todos los términos que sus fuentes **abiertas y con licencia verificada** publican, con procedencia por fila, y un reporte de cobertura que dice exactamente qué sigue faltando y por qué.
- Kill-test: `docs/seed-research/<dominio>.md` todavía lista como "hueco bloqueado por red (403)" una fuente que hoy responde 200 desde esta sesión.

## Alcance
- IN: importadores, `data/` versionado, `SOURCES.md`, `docs/seed-research/<dominio>.md`, tests de parseo con archivos reales, de los 8 dominios abajo.
- OUT: DDL / cambios al modelo (ADR-0021; las propuestas van al reporte, no al repo del modelo); frontend; SNOMED CT, CPT, NANDA/NIC/NOC, MedDRA, DeCS, WHO ATC (licencia); cuentas nuevas en cualquier servicio; eludir captchas.
- Ambigüedades registradas:
  - "Absolutamente todos los términos" = todo lo que las fuentes abiertas permiten. Los vocabularios con licencia que no tenemos quedan declarados como hueco de licencia (decisión del propietario), no se reemplazan por datos propios.
  - Licencias NC/SA dudosas (SIDER, MEDI, ChEMBL CC BY-SA, DrugCentral CC BY-SA, ODbL): se registra la condición; no se cargan las NC. Confirmar con el propietario.
- Sin red del proxy en sesiones previas; en esta sesión sí hay salida a CIMA, RxNav, openFDA, Wikidata, EVS, Zenodo, NCBI FTP, ClinicalTrials, DrugCentral (sondeo 2026-10-27). `loinc.org` 403, `minsalud.gob.bo` sin respuesta.

## H1 — Cierre de huecos por dominio (8 carriles paralelos, archivos disjuntos)
**CA:** Dado el registro de huecos de un dominio, cuando se reintenta cada fuente hoy alcanzable, entonces su contenido queda en el corpus normalizado versionado (`data/`) con URL, versión, fecha, SHA-256 y licencia por fila, y el reporte de cobertura se actualiza con el antes/después.
**DoD:** por dominio: `node --test` del dominio en verde · build reproducible (mismo SHA-256 en 2.ª corrida) · carga en Postgres 16 desechable con 2.ª corrida = 0 filas nuevas · consultas de huérfanos/duplicados/nulos pegadas · `docs/seed-research/<dominio>.md` y `SOURCES.md` actualizados. Peldaño máximo declarable sin más: `TESTED`/`VERIFIED` contra Postgres desechable, **no** contra la base real del stack.
**Estado:** A MEDIAS (13 carriles entregados y revisados; ver REPORTE.md)

| Carril | Directorio exclusivo | Fuentes a reintentar (de los huecos documentados) |
|---|---|---|
| C1 diseases | `diseases/`, `docs/seed-research/diseases.md` | MeSH árbol C, GARD, NANDO, OncoTree, Orphadata ES, CIE-11 |
| C2 symptoms | `symptoms/`, `docs/seed-research/symptoms.md` | Orphadata product4 EN/ES, MeSH C23, Wikidata P3841, `load-disease-phenotypes` |
| C3 lab + procedimientos | `lab-tests/`, `procedures-treatments/` + sus docs | GTR, DICOM CID 29, RadLex Playbook, CUPS/México/SUS, ICHI/ICD-10-PCS, ClinicalTrials |
| C4 allergies | `allergies/`, doc | allergen.org/IUIS, UniProt KW-0020, GSRS/UNII, ChEBI, NCIt Allergen, CVX CDC, RxNav/RxClass |
| C5 clinical-pharmacology | `clinical-pharmacology/`, doc | CIMA fichas completas, openFDA labels, RxNav ATC→RxCUI→UNII |
| C6 drug-treatments | `drug-treatments/`, doc | MED-RT, ChEMBL, DrugCentral, Wikidata P2176, ClinicalTrials, RxClass (H-ATC) |
| C7 dictionaries | `dictionaries/`, doc | Wikidata ES, ChEBI, NCBI Taxonomy, EMDN, AbreMES-DB (Zenodo), FIPAT/TA2 |
| C8 nursing + glosario ES + enciclopedia | `nursing-care/`, `specialty-services/`, `encyclopedia/`, `import-*.mjs` ES, docs | Omaha System, glosario ES (CIE-10-ES, CIMA, MedlinePlus, Wikidata anatomía), s1–s4 |

### Microtareas (idénticas por carril; ID = `H1.<Cn>.Mk`)
| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H1.Cn.M1 | Sondear cada hueco documentado y registrar 200/403 hoy | tabla antes/después en el doc del dominio | `curl -I` por host, salida en `evidencia/<carril>/` | TODO |
| H1.Cn.M2 | Escribir/ajustar el fetch+parser **contra el archivo real descargado** | fixtures reales, nada a ciegas | `node --test` del dominio en verde | TODO |
| H1.Cn.M3 | Build reproducible del corpus normalizado y versionado en `data/` (partes < 45 MB, SHA256SUMS) | mismo SHA-256 en 2 builds | salida de ambos builds | TODO |
| H1.Cn.M4 | Carga en Postgres 16 desechable, 2.ª corrida idempotente | 2.ª corrida = 0 filas nuevas | salida literal de ambas + consultas de integridad | TODO |
| H1.Cn.M5 | Doc de cobertura y `SOURCES.md` actualizados, huecos restantes con motivo exacto | ningún "403" sin re-sondeo de hoy | diff + conteos antes/después | TODO |

## Riesgos y bloqueos previstos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| 8 carriles compiten por CPU/disco/red (4 CPU, 15 GB RAM, ~28 GB libres) | timeouts espurios | `--max-old-space-size` ≤ 2500, 1 Postgres por carril en puerto propio, borrar crudos al terminar, ≤ 1–2 req/s por host |
| Licencias NC/SA | contaminar el catálogo | no cargar NC; registrar en `SOURCES.md`; consultar al propietario |
| Push concurrente a la misma rama | rechazos non-fast-forward | los carriles solo hacen commit local de sus rutas; el push lo hace el agente principal |
| Datos inventados | contaminación irreversible | verbatim de la fuente; sin traducción propia; sin cruces por nombre |
