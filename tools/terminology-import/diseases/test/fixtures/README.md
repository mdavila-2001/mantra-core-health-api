# Fixtures del catálogo de enfermedades

Extractos **verbatim** de los archivos reales de `../../SOURCES.md` (registros
completos, sin editar su contenido; sólo se eligieron unos pocos). Sirven para
probar los lectores sin red y sin base.

| Archivo | Fuente y versión | Licencia / atribución |
|---|---|---|
| `mondo.sample.obo` | Mondo Disease Ontology, release 2026-10-06 | CC BY 4.0 — Monarch Initiative |
| `doid.sample.obo` | Human Disease Ontology, v2026-09-30 | CC0 1.0 |
| `ncit.sample.obo` | (histórica; la carga actual usa el archivo plano de EVS, ver `ncit_evs_flat_26.09d.sample.txt`) NCI Thesaurus OBO Edition 24.04e (2024-05-07; el formato es el mismo que el de la 26.02d que se carga) | CC BY 4.0 — National Cancer Institute |
| `orphanet_es_product1.sample.xml`, `orphanet_en_product1.sample.xml`, `orphanet_en_product7.sample.xml`, `orphanet_en_product3_199.sample.xml` | Orphadata, productos 1, 3 (clasificación 199, podada a la rama del síndrome de Marfan) y 7, extracción 2026-06-23 | CC BY 4.0 — Orphanet (c) INSERM |
| `icd11_simpletab_2026-01.sample.txt` | CIE-11 MMS, tabulación simple en inglés, 2026-01 (filas sin modificar) | CC BY-ND 3.0 IGO — © Organización Mundial de la Salud |
| `icd11_map_11To10_2025-01.sample.txt`, `icd11_map_10To11_2025-01.sample.txt` | Tablas de correspondencia CIE-11 ↔ CIE-10 de la OMS, 2025-01 (filas sin modificar) | CC BY-ND 3.0 IGO — © Organización Mundial de la Salud |
| `hpo_phenotype.sample.hpoa` | Anotaciones HPO, 2026-09-02 | Licencia HPO — Human Phenotype Ontology (hpo.jax.org) |
| `phenopackets/PMID_23086397_Patient_4.json` | phenopacket-store 0.1.27 | BSD-3-Clause — Monarch Initiative |
| `hpo-common/MESH-D002375.tab`, `hpo-common/DO-DOID_0003113.tab` | Anotaciones HPO de enfermedades comunes (Groza et al. 2015), `common_disease_annot.tar.gz` (primeras líneas) | Licencia HPO — Human Phenotype Ontology (hpo.jax.org) |

## Pasada del 2026-10-27 (fuentes abiertas que antes estaban bloqueadas por la red)

Registros y filas **reales**, elegidos a mano. Lo único que se recortó (y cómo) está dicho en cada fila.

| Archivo | Fuente y versión | Recorte | Licencia / atribución |
|---|---|---|---|
| `mesh_desc2026.sample.xml` | MeSH 2026, `desc2026.xml` (NLM): D000130, D001523, D000820, D000001 | Se quitaron los bloques `AllowableQualifiersList` y `PharmacologicalActionList` (no aportan términos); el resto de cada registro es verbatim | Uso libre con atribución — Courtesy of the U.S. National Library of Medicine |
| `mesh_supp2026.sample.xml` | MeSH 2026, `supp2026.xml`: C531599 y C531607 (`SCRClass="3"`) y un SCR de clase 1 | Sólo en el de clase 1: se quitó `PharmacologicalActionList` | ídem |
| `ncit_evs_flat_26.09d.sample.txt`, `ncit_code_cui_map_202402.sample.dat` | NCI Thesaurus 26.09d, `Thesaurus.txt` y `nci_code_cui_map_202402.dat` (NCI EVS): cadena C3058 → C2991, una obsoleta, una retirada y una fuera de C2991 | Filas completas, sin editar | CC BY 4.0 — National Cancer Institute |
| `nando.sample.ttl` | NANDO commit 9af59ee, `results/nando.ttl`: 5 clases, 1 sujeto con sólo `rdfs:seeAlso` y la cabecera `owl:Ontology` | Bloques completos, sin editar | CC BY 4.0 — DBCLS / NIBIOHN |
| `oncotree_2025_10_03.sample.json` | OncoTree 2025-10-03 (MSKCC): rama TISSUE → LUNG → NSCLC → LUAD | Se podaron los demás hijos de cada nodo (`children`); los nodos son verbatim | CC BY 4.0 — Memorial Sloan Kettering Cancer Center |
| `gard_disease_list_2026-09.sample.csv`, `gard_diseases.trimmed.sample.json`, `gard_single_17890.json`, `gard_single_5528.json` | GARD (NCATS/NIH): lista oficial «GARD Rare Disease List Sep2026», `diseases.trimmed.json` y fichas `assets/singles/<id>.json` | Filas / entradas elegidas; las fichas están completas | Sin licencia declarada; obra del NCATS/NIH (ver `SOURCES.md`) |
| `icd11_simpletab_es_2026-01.sample.txt` | CIE-11 MMS 2026-01 en castellano (OMS): las mismas 11 filas que `icd11_simpletab_2026-01.sample.txt` | Filas sin modificar | CC BY-ND 3.0 IGO — © Organización Mundial de la Salud |
| `icd11_map_10To11_2026-01.sample.txt`, `icd11_map_10To11_multiple_2026-01.sample.txt`, `icd11_map_11To10_2026-01.sample.txt` | Tablas de correspondencia de la OMS, release 2026-01 | Filas sin modificar | CC BY-ND 3.0 IGO — © OMS |
| `mplus_topics_2026-10-27.sample.xml` | MedlinePlus, `mplus_topics_2026-10-27.xml`: temas 2238 y 1743 (español) y 122 y 139 (inglés) | Bloques `<health-topic>` completos | Dominio público — MedlinePlus (NLM) |
