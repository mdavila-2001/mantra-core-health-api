# Diccionarios médicos generales: investigación, saturación y cobertura

> Sesión «diccionarios generales» (2026-10-24), rama `claude/vigilant-ramanujan-ms3xcw` → PR contra `dev`.
> Alcance: todo lo que **no** cargan las sesiones hermanas (enfermedades `justin/seed-diseases`, síntomas
> `justin/seed-symptoms`, alergias, análisis, fichas, servicios, medicamentos y enfermería
> `justin/seed-nursing-care`). Acá esos dominios no se cargan: sólo se **enlazan por código**.
> Importadores: `tools/terminology-import/dictionaries/` (README, `SOURCES.md` con URL, SHA-256 y
> licencia de cada uno de los 45 archivos).

## Resumen

- **Construido**: 496 272 conceptos de 43 fuentes (un code system cada una), 693 588
  sinónimos exactos, 386 969 relaciones tipadas publicadas (is-a 284 212, part-of 98 375, develops-from
  3 869, located-in 513), 353 047 xrefs y 1 367 aristas enfermedad → organismo (Mondo 1 057, DOID 310).
- **Cargado por defecto**: 111 389 conceptos de las 23 fuentes que sirven a una consulta del producto. El
  resto (GO, OBA, PATO, ECTO, ENVO, BTO, CLO, OccO, PW…) queda construido y se carga con
  `--include <id>`: es la lección del corpus MeSH de 1,44 M de filas que se retiró por no tener consulta.
- **Medido en Postgres 16 desechable** con el DDL real del módulo 03: 1.ª corrida 46 s → 111 389
  conceptos, 292 796 designaciones (283 641 EN, 8 669 latín, 486 castellano), 222 778 propiedades,
  65 928 relaciones, 7 601 concept_maps; 335 MB la base. **2.ª corrida 28 s → 0 filas nuevas.** Una 3.ª corrida, tras unificar el mapa de prefijos del cargador, sumó 13 concept_maps que el mapa duplicado no reconocía (defecto corregido); la 4.ª, 0 filas nuevas (7 614 concept_maps en total).
- **Castellano**: es el hueco grande. Las ontologías abiertas alcanzables están en inglés; el único
  castellano con idioma declarado por la fuente son 486 nombres de FMA (sin tildes, verbatim). Las fuentes
  en castellano (DeCS, Wikidata, TA2, RANM, MedlinePlus) estaban **bloqueadas por la política de red de
  la sesión** (403). El importador de etiquetas ES de Wikidata quedó escrito y sin correr.
- **Saturación**: las pasadas 7 y 8 aportaron 0 en todos los dominios **sobre el universo alcanzable**
  (registro completo de OBO Foundry + fuentes no OBO conocidas). No es saturación del universo total: las
  fuentes bloqueadas siguen siendo huecos documentados abajo.

## Paso 0: lo que ya había

- `tools/terminology-import/`: importadores del glosario ES (`load-glossary-es.mjs`: CIE-10-ES, CIMA,
  MedlinePlus ES, anatomía de Wikidata con TA98/TA2, LOINC ES, INLASA, relaciones de Wikidata), de NLM
  (ICD-10-CM, LOINC, RxNorm, RxTerms, HCPCS), openFDA NDC, NUCC y el catálogo de medicamentos. El corpus
  del glosario (19 313 términos, 54 865 relaciones de Wikidata) vive fuera del repo; acá se ve el código.
- `src/common/constants/concepts.ts` ya tenía `REL_IS_A` y `REL_PART_OF` (jerarquía genérica), además de
  los ocho tipos del glosario (RELATED_TERM, DISEASE, …, SPECIALTY). Los idiomas eran EN y ES.
- Módulo 03 (`database/SQL/03_terminology/`): `catalog_concepts`, `concept_designations`,
  `concept_properties`, `concept_relationships`, `concept_maps`, `catalog_import_batches`, … Todo lo de
  esta sesión cabe ahí: **no hizo falta DDL** (ADR-0021).
- El repo no tiene `CLAUDE.md` ni `.claude/rules/`.

**Cómo se extiende sin duplicar**: los importadores nuevos reusan `lib/glossary-es/common.mjs` (HTTP,
NDJSON, `deterministicId`) y el `md5uuid` del glosario; escriben en la misma carpeta de build; y enlazan
con lo existente por código idéntico en la carga: `ICD10CM:` → `icd10cm` y `cie10es-diagnosticos-2026`,
`MESH:` y `TA98:` → `glossary-external-ids` de las fichas del glosario.

## Red de la sesión

La política de red sólo dejó pasar `raw.githubusercontent.com`, `git` sobre `github.com` (lectura de
repos públicos), `storage.googleapis.com`, `bitbucket.org` y `registry.npmjs.org`. Respondieron 403:
`query.wikidata.org`, `www.wikidata.org`, `decs.bvsalud.org`, `api.bvsalud.org`, `purl.obolibrary.org`,
`www.ebi.ac.uk`, `ftp.ebi.ac.uk`, `*.nlm.nih.gov`, `eutils.ncbi.nlm.nih.gov`, `evs.nci.nih.gov`,
`webgate.ec.europa.eu`, `health.ec.europa.eu`, `iate.europa.eu`, `fipat.library.dal.ca`,
`ta2viewer.openanatomy.org`, `dtme.ranm.es`, `dpej.rae.es`, `www.termcat.cat`, `www.icn.ch`,
`icd.who.int`, `www.whocc.no`, `zenodo.org`, `huggingface.co`, `*.wikipedia.org`, `en.wiktionary.org`,
`bioportal.bioontology.org`, `lpsn.dsmz.de`, `www.ilo.org`, `esco.ec.europa.eu`, `www.gmdnagency.org`
(y `repo.yarnpkg.com` y `cdn.sheetjs.com`, que afectan a la instalación de dependencias). No se eludió
ninguno: lo que dependía de ellos queda como hueco. Para habilitarlos, el propietario edita «Network
access» del entorno (https://code.claude.com/docs/en/cloud-environments#network-access).

## Protocolo de saturación: pasadas

«Nuevos» = conceptos con clave (`code system` + código) que no estaban en el corpus; la deduplicación es
por clave y, entre fuentes distintas, por xref publicado (concept_maps), nunca por nombre.

| Pasada | Fuentes | Conceptos nuevos | De ellos, por defecto | Relaciones tipadas nuevas | Xrefs | Dominios con aporte | Descartadas (motivo) |
|---:|---|---:|---:|---:|---:|---|---|
| 1 | Uberon, CL, EHDAA2, HsapDv, SO, HGNC, NCBITaxon médica (Mondo + DOID), TRANS, Apollo-SV, STATO, ExO, ECTO, GO, PATO, OGMS (`.obo`), Metainventario | 297 913 | 87 163 | 85 323 | 311 662 | anatomía, histología, embriología, genética, microbiología, salud pública, estadística, exposiciones, fisiología, cualidades, abreviaturas | DeCS, MeSH, NCIt, ChEBI, Wikidata, TA2, RANM, DPTM, IATE, TERMCAT, EMDN, MedlinePlus, PubMed/Europe PMC: hosts bloqueados. AbreMES-DB: datos en Zenodo (bloqueado). GMDN: licencia. SNOMED: Bolivia no es miembro. UMLS: exige cuenta. |
| 2 | AEO, CARO, **FMA** (Bitbucket UW), GENO, OBA, NBO, ENVO | 130 819 | 12 896 | 220 276 | 22 002 | anatomía (+ latín TA98, castellano, epónimos), genética, fisiología, exposiciones | — |
| 3 | OGMS (OWL funcional: el `.obo` publicado tenía 1 término), IDO (RDF/XML), OMRSE | 659 | 659 | 657 | 0 | conceptos generales, salud pública, profesiones | MF, OccO: sólo OWL (se leen en las pasadas 4-5) |
| 4 | BTO, OccO | 8 234 | 0 | 9 111 | 1 | histología, profesiones | MicrO: inactiva, CC BY 2.0, sólo módulos de importación |
| 5 | Barrido del registro OBO Foundry (191 activas): ARO, PBPKO, OPL, OBCS, HANCESTRO, HSO, MF, MFOEM, PW, OMP, OHPI, OHMI, PSI-MOD, RBO, TAXRANK | 19 629 | 10 671 | 23 416 | 19 380 | microbiología, farmacología general, estadística, salud pública, fisiología, bioquímica, exposiciones | CHIRO (sin nombres), GenEpiO (`.obo` vacío), MRO y PRO (sin datos en git) |
| 6 | Re-barrido del registro: las 3 sin clasificar (CLO, PCL, SLSO) | 39 018 | 0 | 48 186 | 2 | histología (líneas celulares, opt-in) | PCL: sin clases en git; SLSO: NASA, fuera de alcance |
| 7 | Re-barrido del registro (191/191 clasificadas) + recheck de los 35 hosts no OBO + repos de GitHub hallados por búsqueda web (ansforge/IG-terminologie-de-sante, PlanTL/AbreMES-DB, NCI-Thesaurus/thesaurus-obo-edition, ebi-chebi/ChEBI, obophenotype/ncbitaxon) | **0** | 0 | 0 | 0 | ninguno | EMDN de ANS: 16 códigos en francés (subconjunto, no el nomenclador); el resto sin datos o bloqueado |
| 8 | Búsqueda web de fuentes abiertas en castellano y de traducciones de Uberon/CL (babelon, hpo-translations), licencias de ICNP/NANDA/NIC/NOC, FMA, Metainventario | **0** | 0 | 0 | 0 | ninguno | Sin traducciones ES de Uberon/CL publicadas; HPO-translations es de la sesión de síntomas; enfermería es de su sesión |

**Saturado (dos pasadas seguidas con 0) en todos los dominios del universo alcanzable.** La pasada 3 cuenta
659 y no 660 porque reemplaza el término único del `ogms.obo` de la pasada 1.

### Clasificación del registro de OBO Foundry (pasadas 5-7)

- **cargada** (36): apollo_sv, aro, bto, cl, ecto, envo, exo, geno, go, hancestro, hsapdv, hso, ido, mf, mfoem, mod, nbo, ncbitaxon, oba, obcs, occo, ogms, ohmi, ohpi, omp, omrse, opl, pato, pbpko, pw, rbo, so, stato, taxrank, trans, uberon
- **hermana** (39): ado (enfermedades), bmont (análisis), chmo (análisis), cido (enfermedades), cmo (análisis), cvdo (enfermedades), dideo (medicamentos), disdriv (enfermedades), doid (enfermedades), dron (medicamentos), emro (síntomas), epio (enfermedades), exmo (servicios), fbbi (análisis), fideo (medicamentos), foodon (alergias), htn (enfermedades), labo (análisis), maxo (servicios), mfomd (enfermedades), mmo (análisis), mondo (enfermedades), mpio (medicamentos), ms (análisis), oae (medicamentos), obi (análisis), ohd (enfermedades), ontoneo (fichas), ovae (medicamentos), pain (síntomas), pdro (medicamentos), symp (síntomas), txpo (medicamentos), uo (análisis), upheno (síntomas), vo (medicamentos), xco (análisis), hp (síntomas), scdo (enfermedades)
- **sin-datos** (6): chebi: ChEBI: sin datos en git; ftp.ebi.ac.uk y purl bloqueados, chiro: CHIRO: 245 ids de ChEBI SIN nombres; sin ChEBI no aporta términos, genepio: GenEpiO: el genepio.obo publicado está vacío (14 bytes); sólo OWL de 2021, mro: MRO: el repo no publica .obo/.owl en git (release en purl, bloqueado), ncit: NCIt OBO: el repo sólo trae imports.ofn; el release es un asset (github.com/purl bloqueados), pr: PRO: sin datos en git; releases en purl (bloqueado)
- **no-humana** (53): agro, aism, amphx, apo, clao, clyh, colao, cteno, ddanat, ddpheno, dpo, ecao, emapa, fao, fbbt, fbcv, fbdv, flopo, fovt, fypo, gallont, hao, lepao, ma, mmusdv, mp, mpath, oarcs, peco, phipo, plana, planp, po, poro, ppo, prefer, pso, rs, spd, to, tto, vbo, vt, vto, wbbt, wbls, wbphenotype, xao, xpo, zeco, zfa, zfs, zp
- **infraestructura** (43): bco, bfo, bspo, cdao, cheminf, cio, cob, cro, cto, duo, eco, gecko, gno, hom, iao, iceo, ico, ino, mco, mcro, mi, miapa, mop, ncro, ngbo, nomen, obib, ogg, omit, omo, ontoavida, opmi, ornaseq, proco, psdo, ro, rxno, sepio, swo, t4fs, xlmod, kisao, sbo
- **otra** (11): afpo: poblaciones africanas, fuera del alcance boliviano, cdno: nutrición (sesión de alergias/alimentos), ecocore: ecología, no médica, fobi: nutrición (sesión de alergias/alimentos), gaz: geografía, no médica, geo: geografía, no médica, one: nutrición (sesión de alergias/alimentos), ons: nutrición (sesión de alergias/alimentos), oostt: estructura de centros de trauma de EE. UU., fuera del alcance boliviano, pco: ecología de poblaciones, no médica, gsso: género y sexualidad: dato demográfico de fichas (sesión de fichas)
- **evaluadas en la pasada 6** (3): clo (cargada opt-in), pcl (sin clases en git), slso (ciencias espaciales de la NASA, fuera de alcance)

## Cobertura por fuente

| Fuente | code system | Dominio | Carga | Conceptos | Por defecto | Con definición | Sinónimos EXACT | Relaciones tipadas | Xrefs |
|---|---|---|---|---:|---:|---:|---:|---:|---:|
| ncbitaxon-medical | `ncbitaxon` | microbiology | default | 1 331 | 1 331 | 0 | 610 | 1 330 | 0 |
| uberon | `uberon` | anatomy | default | 13 412 | 13 412 | 10 885 | 24 123 | 17 437 | 40 035 |
| cl | `cl` | histology | default | 3 070 | 3 070 | 2 972 | 2 634 | 5 890 | 1 927 |
| ehdaa2 | `ehdaa2` | embryology | default | 2 456 | 2 456 | 0 | 1 | 8 032 | 0 |
| aeo | `aeo` | anatomy | default | 133 | 133 | 133 | 0 | 159 | 0 |
| caro | `caro` | anatomy | default | 84 | 84 | 81 | 3 | 106 | 2 |
| hsapdv | `hsapdv` | embryology | default | 239 | 239 | 239 | 36 | 475 | 224 |
| so | `sequence-ontology` | genetics | default | 2 409 | 2 409 | 2 404 | 3 807 | 2 702 | 501 |
| ogms | `ogms` | general-medicine | default | 119 | 119 | 111 | 0 | 119 | 0 |
| ido | `ido` | public-health | default | 253 | 253 | 253 | 0 | 259 | 0 |
| omrse | `omrse` | professions | default | 288 | 288 | 229 | 23 | 279 | 0 |
| trans | `pathogen-transmission` | public-health | default | 32 | 32 | 32 | 4 | 31 | 0 |
| apollo_sv | `apollo-sv` | public-health | default | 616 | 616 | 539 | 0 | 623 | 0 |
| stato | `stato` | statistics | default | 712 | 712 | 710 | 0 | 880 | 0 |
| ecto | `ecto` | exposures | opt-in | 4 487 | 0 | 4 487 | 4 500 | 7 240 | 0 |
| exo | `exo` | exposures | default | 163 | 163 | 160 | 8 | 174 | 58 |
| geno | `geno` | genetics | default | 222 | 222 | 173 | 0 | 241 | 23 |
| oba | `oba` | physiology | opt-in | 25 364 | 0 | 25 348 | 57 843 | 52 490 | 11 680 |
| nbo | `nbo` | physiology | opt-in | 932 | 0 | 764 | 401 | 1 003 | 163 |
| envo | `envo` | exposures | opt-in | 4 007 | 0 | 3 801 | 1 738 | 5 067 | 2 693 |
| bto | `bto` | histology | opt-in | 6 511 | 0 | 5 460 | 2 | 6 465 | 1 |
| occo | `occo` | professions | opt-in | 1 723 | 0 | 1 143 | 0 | 2 646 | 0 |
| aro | `aro` | microbiology | default | 9 030 | 9 030 | 9 030 | 2 111 | 9 389 | 2 195 |
| pbpko | `pbpko` | pharmacology | default | 858 | 858 | 705 | 0 | 858 | 0 |
| opl | `opl` | microbiology | default | 413 | 413 | 413 | 0 | 730 | 11 |
| obcs | `obcs` | statistics | default | 370 | 370 | 297 | 0 | 375 | 14 |
| hancestro | `hancestro` | public-health | opt-in | 589 | 0 | 328 | 391 | 1 004 | 0 |
| hso | `hso` | public-health | opt-in | 104 | 0 | 61 | 0 | 104 | 0 |
| mf | `mental-functioning` | physiology | opt-in | 95 | 0 | 88 | 0 | 96 | 0 |
| mfoem | `emotion-ontology` | physiology | opt-in | 219 | 0 | 195 | 0 | 220 | 0 |
| pw | `pathway-ontology` | physiology | opt-in | 2 704 | 0 | 2 516 | 521 | 3 388 | 3 |
| omp | `omp` | microbiology | opt-in | 2 006 | 0 | 1 804 | 145 | 2 413 | 168 |
| ohpi | `ohpi` | microbiology | opt-in | 105 | 0 | 4 | 0 | 103 | 0 |
| ohmi | `ohmi` | microbiology | opt-in | 896 | 0 | 890 | 0 | 945 | 0 |
| mod | `psi-mod` | biochemistry | opt-in | 1 971 | 0 | 1 971 | 4 914 | 3 521 | 16 880 |
| rbo | `rbo` | exposures | opt-in | 192 | 0 | 137 | 15 | 195 | 13 |
| taxrank | `taxrank` | microbiology | opt-in | 77 | 0 | 3 | 8 | 75 | 96 |
| clo | `clo` | histology | opt-in | 39 018 | 0 | 2 846 | 0 | 48 186 | 2 |
| go | `gene-ontology` | physiology | opt-in | 37 948 | 0 | 37 948 | 57 172 | 38 235 | 22 549 |
| pato | `pato` | qualities | opt-in | 1 943 | 0 | 1 927 | 689 | 2 274 | 53 |
| fma | `fma` | anatomy | default | 100 077 | 12 457 | 1 598 | 56 160 | 161 210 | 7 441 |
| hgnc | `hgnc` | genetics | default | 45 277 | 45 277 | 0 | 101 796 | 0 | 246 315 |
| abbreviations-metainventory | `medical-abbreviations-metainventory` | abbreviations | default | 183 817 | 17 445 | 0 | 373 933 | 0 | 0 |

## Cobertura por dominio

| Dominio | Conceptos construidos | Cargados por defecto | Fuentes |
|---|---:|---:|---|
| Microbiología y parasitología (`microbiology`) | 13 858 | 10 774 | ncbitaxon-medical, aro, opl, omp, ohpi, ohmi, taxrank |
| Anatomía (`anatomy`) | 113 706 | 26 086 | uberon, aeo, caro, fma |
| Histología y tipos celulares (`histology`) | 48 599 | 3 070 | cl, bto, clo |
| Embriología y desarrollo (`embryology`) | 2 695 | 2 695 | ehdaa2, hsapdv |
| Genética (`genetics`) | 47 908 | 47 908 | so, geno, hgnc |
| Conceptos generales de medicina (`general-medicine`) | 119 | 119 | ogms |
| Salud pública y epidemiología (`public-health`) | 1 594 | 901 | ido, trans, apollo_sv, hancestro, hso |
| Profesiones, roles y organizaciones sanitarias (`professions`) | 2 011 | 288 | omrse, occo |
| Estadística y métodos de investigación (`statistics`) | 1 082 | 1 082 | stato, obcs |
| Exposiciones ambientales (`exposures`) | 8 849 | 163 | ecto, exo, envo, rbo |
| Fisiología y procesos biológicos (`physiology`) | 67 262 | 0 | oba, nbo, mf, mfoem, pw, go |
| Farmacología general (clases, mecanismos y farmacocinética) (`pharmacology`) | 858 | 858 | pbpko |
| Bioquímica (`biochemistry`) | 1 971 | 0 | mod |
| Cualidades fenotípicas (PATO) (`qualities`) | 1 943 | 0 | pato |
| Abreviaturas clínicas (`abbreviations`) | 183 817 | 17 445 | abbreviations-metainventory |

### Lo que se enlaza con lo existente

| Enlace | Cómo (código idéntico declarado por la fuente) | Medido en la base desechable |
|---|---|---:|
| Uberon → FMA | xref `FMA:` de Uberon → concepto FMA cargado | 6 026 concept_maps |
| Uberon → EHDAA2 / AEO / CARO / CL | xrefs `EHDAA2:`, `AEO:`, `CARO:`, `CL:` | 1 517 |
| CL, HsapDv, OPL, CARO, GENO → FMA / Uberon / EHDAA2 / CL / SO | sus xrefs | 58 |
| FMA → anatomía del glosario (Wikidata, TA98) | TA_ID de FMA = `glossary-external-ids.ta98` | se resuelve en la carga (la base desechable no tenía glosario) |
| Uberon / CL → fichas del glosario | xref `MESH:` = `glossary-external-ids.mesh` | ídem |
| Enfermedad (sesión hermana) → organismo | Mondo `disease_has_infectious_agent` (RO:0014001) y `transmitted_by` (RO:0002451), sólo con xrefs `MONDO:equivalentTo`; DOID `has material basis in` + taxón y `transmitted by` | 1 367 aristas; 1 204 con organismo cargado. Mecanismo verificado con un concepto de prueba con código `J13` (borrado después): 1 relación hacia *Streptococcus pneumoniae* |
| MONDO/DOID → su code system | si otra sesión los cargó con el PURL oficial (`mondo.owl`, `doid.owl`) | ídem |

## Huecos

| Dominio | Hueco | Por qué | Qué lo cierra |
|---|---|---|---|
| Todos | Nombres en castellano | Las ontologías abiertas alcanzables están en inglés; DeCS, Wikidata, TA2 y MedlinePlus, bloqueados | Habilitar `query.wikidata.org` y correr `import-wikidata-es-labels.mjs`; habilitar DeCS (BIREME) y escribir su importador contra el archivo real |
| Anatomía | TA2 en latín/inglés/español | FIPAT bloqueado; TA2 no está en git | Habilitar FIPAT. Mientras tanto el latín TA98 entra por FMA (8 669 nombres latinos en 6 744 clases) |
| Microbiología | 138 taxones declarados por Mondo sin etiqueta | El módulo de importación de NCBITaxon de Mondo es más viejo que sus aristas | NCBI Taxonomy (FTP bloqueado) o un release de OBO NCBITaxon |
| Microbiología | LPSN (nomenclatura procariota) | Bloqueado | Habilitar `lpsn.dsmz.de` y verificar licencia |
| Farmacología general | Clases farmacológicas y mecanismos (ATC 1-4, MeSH «Pharmacological Action», MED-RT, roles de ChEBI, NCIt) | Todos bloqueados; CHIRO trae los ids de ChEBI sin nombres | Habilitar `ftp.ebi.ac.uk` (ChEBI) o `purl.obolibrary.org` (NCIt OBO). ARO cubre las clases de antibióticos y PBPKO la farmacocinética |
| Bioquímica | ChEBI, PRO | Bloqueados | Ídem |
| Dispositivos | GMDN / EMDN | GMDN exige membresía; EMDN bloqueado (UE) | Habilitar `webgate.ec.europa.eu` (EMDN es de acceso libre de la Comisión; confirmar licencia de reutilización) |
| Especialidades y profesiones | Nada nuevo en castellano | ESCO/ISCO (OIT) bloqueados; ya existen NUCC, `bo-professions`, `bo-occupations` y las especialidades de Wikidata del glosario | OMRSE aporta roles y organizaciones; OccO (EE. UU.) queda opt-in |
| Epónimos, prefijos, sufijos, raíces | Sin fuente abierta estructurada | Wiktionary/Wikipedia bloqueados; los diccionarios (RANM, Cosnautas) tienen copyright | Epónimos anatómicos: 267 estructuras de FMA. El resto, hueco |
| Abreviaturas | En castellano | AbreMES-DB (PlanTL, licencia MIT) está en Zenodo, bloqueado | Habilitar `zenodo.org` y cargar AbreMES-DB (registro 2207130) |
| Salud pública | MeSH «Epidemiologic Methods», DeCS | Bloqueados | Ídem DeCS |
| Literatura | Detección de huecos con PubMed / Europe PMC | APIs bloqueadas | Habilitar `eutils.ncbi.nlm.nih.gov` / `www.ebi.ac.uk` |
| Referencia | UMLS Metathesaurus como medida de cobertura | Exige cuenta UTS | **Pendiente del propietario** (no se creó cuenta) |

## Licencias: estado de confirmación

1. **FMA** — licencia abierta de la UW (2006) / CC BY 3.0 según Bioregistry; la página oficial no fue
   alcanzable. **Confirmada por el propietario el 2026-10-24.**
2. **EMDN** — si se habilita: el portal de la Comisión dice «accesible a todos, sin cargo»; confirmar la
   política de reutilización (Decisión 2011/833/UE) antes de cargarla.
3. **UMLS** — requiere que el propietario acepte la licencia UTS.

## Qué requiere el repo del modelo

Nada bloqueante: todo entró en las tablas del módulo 03. Propuestas para
`mantra-core-technologies/mantra-core-health-model`, a decidir allá:

1. **Procedencia por relación y por designación.** `concept_relationships` y `concept_designations` no
   tienen columnas de fuente/versión. Acá la procedencia de cada relación tipada va en la propiedad
   `dictionary-entry.relations[].relationshipId` del concepto origen, y la del nombre en
   `dictionary-provenance` (o `dictionary-es-labels` para Wikidata). Una columna `source_id` +
   `source_version` (o una tabla de propiedades de relación) lo haría consultable con SQL.
2. **Tipo de mapeo «database cross-reference».** `concept_maps.equivalence_concept_id` se deja nulo para
   los xrefs OBO, que no afirman equivalencia. Un concepto `relatedto`/`xref` en el value set de
   equivalencias lo haría explícito.
3. **Tamaño de `concept_properties`**: 195 MB de los 335 MB (JSON de xrefs de HGNC, registros del
   Metainventario). Si molesta, partir `dictionary-entry` en propiedades más chicas o mover los xrefs a
   `concept_maps` contra code systems «externos» sin conceptos (exigiría modelar conceptos externos).

Cambios de **datos** (no DDL) que trae este PR en `src/common/constants/concepts.ts`, aditivos:
`LANG_LA` (latín) y los tipos de relación `REL_DEVELOPS_FROM`, `REL_LOCATED_IN`, `REL_INFECTIOUS_AGENT`,
`REL_TRANSMITTED_BY`. Los siembra la API al arrancar, como el resto de `CONCEPT_DEFS`.

## Para el producto

- Estos conceptos **no entran al glosario** (`/glossary` lee el value set `glossary-all-terms`, en
  castellano): están en inglés. Se consultan por la API de terminología (búsqueda por code system,
  `$lookup`, `$translate` vía concept_maps). Sumarlos al glosario es una decisión del propietario, idealmente
  después de tener las etiquetas ES.
- La vecindad del glosario sólo publica sus ocho tipos de relación: is-a, part-of, develops-from,
  located-in, infectious-agent y transmitted-by no se ven ahí (`glossaryRelationTypeFromConceptId`
  devuelve `undefined`). Mostrar «agente infeccioso» en la ficha de una enfermedad es un cambio de API
  aparte.

## Verificación

- `node --test "tools/terminology-import/dictionaries/test/*.test.mjs"`: 18/18 (recortes reales de
  Uberon, CL, SO, Mondo, DOID, HGNC, Metainventario, OGMS e IDO). Con los del glosario: 52/52.
- `corepack yarn typecheck` (tsc): verde. `eslint` y `prettier --check` sobre `concepts.ts`: verdes
  (los `.mjs` de `tools/` están fuera del alcance de `yarn lint`, como el resto del directorio).
- Jest dirigido: `concept-codes`, `glossary-seed.service`, `glossary-terms.catalog`,
  `dynamic-enum-catalog` y todo `src/modules/terminology` (396/397 en total). El rojo es
  `xlsx-parser.spec.ts`, que falla igual sin estos cambios: la sesión no pudo bajar `xlsx-0.20.3` de
  `cdn.sheetjs.com` (bloqueado) y usó `xlsx@0.18.5` de npm sólo para verificar.
- Carga real en Postgres 16 desechable (DDL de `database/SQL/00_shared` + `03_terminology`, conceptos
  internos sembrados con los mismos ids deterministas): ver «Resumen».
