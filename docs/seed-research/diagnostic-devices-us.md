# Equipos de diagnóstico registrados ante FDA — bitácora de búsqueda, saturación y cobertura

Rama `justin/seed-dx-devices-us` (espejo de `claude/compassionate-brown-tr71nn`) · importador en
`tools/terminology-import/diagnostic-devices/us/` · fuentes y licencias en
`tools/terminology-import/diagnostic-devices/us/SOURCES.md` · plan y reporte en
[`PLAN.md`](../trabajo/2026-10-24-seed-dx-devices-us/PLAN.md) y
[`REPORTE.md`](../trabajo/2026-10-24-seed-dx-devices-us/REPORTE.md).

Pedido del propietario: «que investigue profundamente todos y cada uno de los equipos de
diagnóstico con todos los posibles proveedores que lo ofrecen en el mundo (marcas)… ultra
detallado… que el corpus sea abrumadoramente grande y que sea imposible encontrar más en
internet». Esta sesión es la dueña de los registros de **EE. UU. (FDA)**.

## Red de esta sesión

El contenedor sólo alcanza GitHub (git y `raw.githubusercontent.com`), GitLab, Bitbucket, npm,
PyPI (archivos), Maven Central, RubyGems, conda, S3 y GCS. Devuelven 403 en el proxy o no
resuelven (sondeado el 2026-10-24): `accessgudid.nlm.nih.gov`, `accessgudid.awsprod.nlm.nih.gov`,
`api.fda.gov`, `download.open.fda.gov`, `www.accessdata.fda.gov`, `www.fda.gov`, `www.ecfr.gov`,
`www.govinfo.gov`, `www.nber.org`, `catalog.data.gov`, `healthdata.gov`, `www.datalumos.org`,
`download.cms.gov`, `openpaymentsdata.cms.gov`, `huggingface.co`, `www.kaggle.com`, `zenodo.org`,
`figshare.com`, `dataverse.harvard.edu`, `archive.org`, `web.archive.org`, `query.wikidata.org`,
`api.github.com` (salvo los repos de la sesión). `pypi.org/search` responde con un desafío
JavaScript: no se intentó pasarlo.

Consecuencia: las fuentes oficiales se reemplazan por **espejos públicos fijados por commit**
que declaran la URL oficial, la fecha de exportación y (cuando la publican) el sha256 del
archivo oficial. No se probó ningún host alternativo de FDA (por ejemplo, el bucket de openFDA
vía `s3.amazonaws.com`): sería el mismo origen bloqueado con otro nombre. La búsqueda web (del
lado del servidor) se usó **sólo para descubrir fuentes y verificar criterios**; ningún dato que
pase por un resumen de modelo se cargó.

## Pasadas (protocolo de saturación)

Aportes nuevos contados tras deduplicar por `source` + `sourceRecordId` (K-number, PMA +
nombre comercial, UDI-DI); entre vías, gana la oficial. Fabricantes por razón social normalizada
exacta (`manufacturerKey`), marcas por fabricante + nombre comercial exacto. Nunca por parecido.

| # | Fecha | Fuentes | Registros nuevos | Fabricantes nuevos | Marcas nuevas | Descartadas en la pasada (motivo) |
|---|---|---|---|---|---|---|
| 1 | 2026-10-24 | openFDA `device/510k` export 2026-08-10, espejo `choiben314/510k-lineage@806b59cb` (`dataset/devices.csv`, 175 757 filas) | 71 760 (71 523 510(k) + 237 De Novo) | 12 453 | 68 352 | 104 000 filas fuera de alcance (implantes, quirúrgicos, terapéuticos…); npm y PyPI (sólo clientes de API, sin datos); `pypi.org/search` (desafío JS) |
| 2 | 2026-10-24 | FDA `foiclass.zip` crudo, espejo `ej86/fda-ai-medical-device-analytics@8840a036` (7 088 product codes) · paquete R `bjoleary/fdadata@227bdaa2` (archivos de descarga FDA `pmn*.zip`, `pma.zip`, `foiclass.zip`, «accessed 2026-10-20»: 176 466 510(k)/De Novo con dirección y país, 57 373 PMA con suplementos, 7 097 product codes) · lista FDA «AI-Enabled Medical Devices» (1 524, espejo ej86) | 3 081 (2 646 PMA + 432 510(k) + 3 De Novo) · además: nombre FDA del tipo en 3 268 de 3 270 product codes y país en 72 195 registros | 121 | 3 710 | `premarket.rda` (une `pmn` y `pma`: duplicado); país de `pma.rda` (fdadata pone `USA` a todos: no es dato de FDA, queda sólo en `extra.countryAsPublished`); 230 product codes retirados que sólo aparecen en 510(k) viejos sin clasificación publicada |
| 3 | 2026-10-24 | AccessGUDID **Full Release XML 2025-05-01** filtrado a especialidad dental, espejo `Delapro/GUDID@9237402a` (20 zip, 812 322 registros de dispositivo) | 3 130 UDI-DI (radiología dental extraoral/intraoral, portapelículas, seguimiento mandibular, procesamiento de imagen, probadores pulpares, detectores de caries…) con modelo, DUNS, 510(k) y GMDN con código | 71 | 809 | 809 192 registros dentales fuera de alcance (implantes, prótesis, instrumental); el resto de GUDID (otros paneles) no tiene espejo público alcanzable. Se conservan tal cual los product codes que declara el etiquetador, aunque alguno sea dudoso (p. ej. un TENS declarado como `MUH`): GUDID es declaración del fabricante |
| 4 | 2026-10-24 | Lista FDA «Nucleic Acid Based Tests» por patógeno, `double-strand/IVDmicrobialNAATregistry@6cdd1e5e` (456 filas, 255 K-numbers) · listas FDA de IA `lotterlab/fda_ai_search@adcdeda1` (1 248) y `dcxht/ValidMed@4f9c75f3` (1 430) · subconjunto openFDA de neurología `mehulseth/bci-fda-rnpv@df4f768c` (6 176) | **0** (sólo enriquecimiento: 253 510(k) moleculares con `extra.fdaNaatList`, patógenos con TaxID de NCBI y tecnología) | 0 | 0 | `K133448` y `K133883` de la lista NAAT no están en ningún archivo de descarga FDA alcanzable: sin fabricante ni product code verificable, no se crean filas; `P140011/S008` de ValidMed, ídem; listas de IA y neurología: todos sus envíos ya estaban (subconjuntos de pmn/pma) |
| 5 | 2026-10-24 | FDA **Establishment Registration & Device Listing**, archivos planos 2024 (`Registration.txt` 46 496, `registration_listing.txt` 325 731, `Listing_PCD.txt` 316 023, `Owner_Operator.txt`), espejo `sdgoldberg/MedDev@6cbd231b` · **LIVD SARS-CoV-2** de CDC (pruebas IVD con EUA de FDA; 1 144 filas), `CDCgov/routes@e2e16eed` · extracto de la base **CLIA** de FDA (20 832 filas documento → sistema de prueba → analito, 2025-03), `unmtransinfo/cfde-biomarkers@9a121841` | 111 101 (110 614 listados de establecimiento por product code + 487 kits de prueba con EUA, 7 con UDI-DI) · además: 2 218 autorizaciones con analitos CLIA | 5 755 | 475 | GUDID `device.txt` ~2020-02 de `misterrPink1/symmetric@a43a1a58` (2 424 295 dispositivos **sin product code**: decidir el alcance exigiría cruzar por nombre, prohibido); extracto GUDID 2026-07-23 de `russellmiller49/Interventional-Pulm-Education-Project@b18a0f5b` (15 229, sin product code, mismo motivo); UDI de audífonos de `SyneticSLZ/MarketIntel@13c86b7b` (874.3300, prótesis: fuera de alcance); muestras de 100 a 1 000 filas (`mgree/ffs`, `AmitXShukla/P2P.ai`, `ikmdev/tinkar-core`); EUA COVID 2020 de `TommyJones/covid_fda_eua_tests` (59, contenidas en LIVD); `datasets.zip` de `symmetric` es MDALL de Health Canada (se pasó a la sesión ROW) |

<!-- coverage:start -->
## Cobertura (generada por `coverage-report.mjs`)

| | Cantidad |
|---|---|
| Registros (filas del NDJSON) | 189 072 |
| · `fda-rl` | 110 614 |
| · `fda-510k` | 71 955 |
| · `fda-gudid` | 3 130 |
| · `fda-pma` | 2 646 |
| · `cdc-livd-sars-cov-2` | 487 |
| · `fda-denovo` | 240 |
| UDI-DI (con modelo/versión) | 3 137 |
| Fabricantes distintos (razón social normalizada exacta) | 18 396 |
| Marcas distintas (fabricante + nombre comercial) | 72 594 |
| Registros con país del fabricante | 182 809 |
| Product codes vistos / incluidos / excluidos | 7 119 / 3 270 / 3 849 |

### Product codes por panel (incluidos / excluidos)

| Panel | Incluidos | Excluidos | Registros de equipos |
|---|---|---|---|
| CH — Clinical Chemistry | 563 | 1 | 31 333 |
| MI — Microbiology | 549 | 0 | 15 166 |
| HE — Hematology | 405 | 23 | 9 424 |
| IM — Immunology | 315 | 0 | 7 518 |
| TX — Clinical Toxicology | 287 | 0 | 9 949 |
| CV — Cardiovascular | 199 | 266 | 32 241 |
| GU — Gastroenterology, Urology | 170 | 454 | 14 020 |
| PA — Pathology | 154 | 0 | 3 745 |
| RA — Radiology | 140 | 75 | 32 300 |
| OP — Ophthalmic | 123 | 213 | 3 793 |
| AN — Anesthesiology | 82 | 172 | 5 778 |
| OB — Obstetrics/Gynecology | 81 | 196 | 3 854 |
| NE — Neurology | 71 | 211 | 5 391 |
| EN — Ear, Nose, Throat | 41 | 219 | 3 096 |
| HO — General Hospital | 23 | 325 | 2 995 |
| DE — Dental | 22 | 333 | 4 076 |
| PM — Physical Medicine | 13 | 214 | 851 |
| OR — Orthopedic | 12 | 322 | 2 576 |
| SU — General, Plastic Surgery | 11 | 595 | 436 |
| MG — Medical Genetics | 9 | 0 | 43 |
| sin panel publicado | 0 | 230 | 0 |

### Criterio: subpartes de 21 CFR incluidas y excluidas

| Parte.subparte | Título | ¿Entra? | Product codes |
|---|---|---|---|
| 862.1xxx | Subpart B — Clinical Chemistry Test Systems | sí | 436 |
| 862.2xxx | Subpart C — Clinical Laboratory Instruments | sí | 91 |
| 862.3xxx | Subpart D — Clinical Toxicology Test Systems | sí | 271 |
| 864.1xxx | Subpart B — Biological Stains | sí | 144 |
| 864.2xxx | Subpart C — Cell and Tissue Culture Products | sí | 18 |
| 864.3xxx | Subpart D — Pathology Instrumentation and Accessories | sí | 60 |
| 864.4xxx | Subpart E — Specimen Preparation Reagents | sí | 61 |
| 864.5xxx | Subpart F — Automated and Semi-Automated Hematology Devices | sí | 41 |
| 864.6xxx | Subpart G — Manual Hematology Devices | sí | 26 |
| 864.7xxx | Subpart H — Hematology Kits and Packages | sí | 97 |
| 864.8xxx | Subpart I — Hematology Reagents | sí | 24 |
| 864.9xxx | Subpart J — Products Used in Establishments That Manufacture Blood and Blood Products | no | 23 |
| 866.1xxx | Subpart B — Diagnostic Devices | sí | 27 |
| 866.2xxx | Subpart C — Microbiology Devices | sí | 79 |
| 866.3xxx | Subpart D — Serological Reagents | sí | 402 |
| 866.4xxx | Subpart E — Immunology Laboratory Equipment and Reagents | sí | 19 |
| 866.5xxx | Subpart F — Immunological Test Systems | sí | 245 |
| 866.6xxx | Subpart G — Tumor Associated Antigen Immunological Test Systems | sí | 36 |
| 868.1xxx | Subpart B — Diagnostic Devices | sí | 48 |
| 868.2xxx | Subpart C — Monitoring Devices | sí | 34 |
| 868.3xxx | Subpart D — Prosthetic Devices | no | 1 |
| 868.5xxx | Subpart F — Therapeutic Devices | no | 135 |
| 868.6xxx | Subpart G — Miscellaneous | no | 13 |
| 870.1xxx | Subpart B — Cardiovascular Diagnostic Devices | sí | 112 |
| 870.2xxx | Subpart C — Cardiovascular Monitoring Devices | sí | 87 |
| 870.3xxx | Subpart D — Cardiovascular Prosthetic Devices | no | 53 |
| 870.4xxx | Subpart E — Cardiovascular Surgical Devices | no | 59 |
| 870.5xxx | Subpart F — Cardiovascular Therapeutic Devices | no | 38 |
| 872.1xxx | Subpart B — Diagnostic Devices | sí | 18 |
| 872.2xxx | Subpart B — Diagnostic Devices (872.2050 dental sonography, 872.2060 jaw tracking) | sí | 4 |
| 872.3xxx | Subpart D — Prosthetic Devices | no | 109 |
| 872.4xxx | Subpart E — Surgical Devices | no | 99 |
| 872.5xxx | Subpart F — Therapeutic Devices | no | 37 |
| 872.6xxx | Subpart G — Miscellaneous Devices | no | 62 |
| 874.1xxx | Subpart B — Diagnostic Devices | sí | 21 |
| 874.3xxx | Subpart D — Prosthetic Devices | no | 64 |
| 874.4xxx | Subpart E — Surgical Devices | no | 110 |
| 874.5xxx | Subpart F — Therapeutic Devices | no | 18 |
| 876.1xxx | Subpart B — Diagnostic Devices | sí | 167 |
| 876.2xxx | Subpart C — Monitoring Devices | sí | 3 |
| 876.3xxx | Subpart D — Prosthetic Devices | no | 7 |
| 876.4xxx | Subpart E — Surgical Devices | no | 81 |
| 876.5xxx | Subpart F — Therapeutic Devices | no | 307 |
| 878.1xxx | Subpart B — Diagnostic Devices | sí | 10 |
| 878.3xxx | Subpart D — Prosthetic Devices | no | 74 |
| 878.4xxx | Subpart E — Surgical Devices | no | 440 |
| 878.5xxx | Subpart F — Therapeutic Devices | no | 30 |
| 880.2xxx | Subpart C — General Hospital and Personal Use Monitoring Devices | sí | 23 |
| 880.5xxx | Subpart F — General Hospital and Personal Use Therapeutic Devices | no | 166 |
| 880.6xxx | Subpart G — General Hospital and Personal Use Miscellaneous Devices | no | 121 |
| 882.1xxx | Subpart B — Neurological Diagnostic Devices | sí | 72 |
| 882.4xxx | Subpart E — Neurological Surgical Devices | no | 59 |
| 882.5xxx | Subpart F — Neurological Therapeutic Devices | no | 97 |
| 884.1xxx | Subpart B — Obstetrical and Gynecological Diagnostic Devices | sí | 41 |
| 884.2xxx | Subpart C — Obstetrical and Gynecological Monitoring Devices | sí | 40 |
| 884.3xxx | Subpart D — Obstetrical and Gynecological Prosthetic Devices | no | 6 |
| 884.4xxx | Subpart E — Obstetrical and Gynecological Surgical Devices | no | 85 |
| 884.5xxx | Subpart F — Obstetrical and Gynecological Therapeutic Devices | no | 61 |
| 884.6xxx | Subpart G — Assisted Reproduction Devices | no | 21 |
| 886.1xxx | Subpart B — Diagnostic Devices | sí | 121 |
| 886.3xxx | Subpart D — Prosthetic Devices | no | 26 |
| 886.4xxx | Subpart E — Surgical Devices | no | 108 |
| 886.5xxx | Subpart F — Therapeutic Devices | no | 53 |
| 888.1xxx | Subpart B — Diagnostic Devices | sí | 12 |
| 888.3xxx | Subpart D — Prosthetic Devices | no | 192 |
| 888.4xxx | Subpart E — Surgical Devices | no | 62 |
| 888.5xxx | Subpart F — Therapeutic Devices | no | 10 |
| 890.1xxx | Subpart B — Physical Medicine Diagnostic Devices | sí | 13 |
| 890.3xxx | Subpart D — Physical Medicine Prosthetic Devices | no | 114 |
| 890.5xxx | Subpart F — Physical Medicine Therapeutic Devices | no | 97 |
| 892.1xxx | Subpart B — Diagnostic Devices | sí | 111 |
| 892.2xxx | Subpart B — Diagnostic Devices (892.2000–892.2100: imagen, PACS, CADe/CADx) | sí | 29 |
| 892.5xxx | Subpart F — Therapeutic Devices | no | 45 |
| 892.6xxx | Subpart G — Miscellaneous Devices (protección radiológica) | no | 12 |

Excepciones (regulación o product code), con su motivo:

| Regla | ¿Entra? | Motivo | Product codes |
|---|---|---|---|
| `regulation:874.4680` | sí | Broncoscopio: endoscopía diagnóstica (FDA lo ubica en Subpart E — Surgical) | BST, BTG, BWH, ENZ, EOQ, JEI, JEJ, JEK, JEL, KTI, KTR, NLE, QNW |
| `regulation:874.4760` | sí | Nasofaringoscopio: endoscopía diagnóstica (Subpart E) | EOB, EQN |
| `regulation:874.4710` | sí | Esofagoscopio: endoscopía diagnóstica (Subpart E) | EOX |
| `regulation:874.4750` | sí | Laringoestroboscopio: diagnóstico de la voz (Subpart E) | EQL |
| `regulation:874.4770` | sí | Otoscopio (Subpart E) | ERA |
| `regulation:874.4720` | sí | Mediastinoscopio: endoscopía diagnóstica (Subpart E) | EWY |
| `regulation:880.2420` | no | Monitor de infusión por gravedad: mide la infusión, no al paciente | FLN |
| `regulation:880.2800` | no | Indicador de esterilización: controla el proceso, no al paciente | FRC, JOJ, LRT, MRB, MTC, OCI, QKM |
| `regulation:864.9650` | sí | Control de calidad de reactivos de banco de sangre | KSF, PFK |
| `regulation:864.9600` | sí | Medios potenciadores para diagnóstico in vitro | KSG |
| `regulation:864.9550` | sí | Lectinas y protectinas (reactivos de tipificación) | KSI |
| `regulation:864.9400` | sí | Solución enzimática estabilizada (reactivo inmunohematológico) | KSK |
| `regulation:864.9320` | sí | Solución de sulfato de cobre: tamizaje de hemoglobina del donante | KSL |
| `regulation:864.9300` | sí | Sistema automatizado de prueba de Coombs | KSM |
| `regulation:864.9285` | sí | Centrífuga lavadora de células para inmunohematología | KSN |
| `regulation:864.9275` | sí | Centrífuga de banco de sangre para diagnóstico in vitro | KSO |
| `regulation:864.9160` | sí | Sustancias de grupo sanguíneo para tipificación in vitro | KSX |
| `regulation:864.9185` | sí | Visor para tipificación de grupo sanguíneo | KSY |
| `regulation:864.9175` | sí | Sistema automatizado de grupo sanguíneo y anticuerpos | KSZ, OQX, PBC |
| `regulation:880.2930` | no | Cronómetro de Apgar: no mide al paciente | LHB |
| `product_code:NAY` | no | Sistema quirúrgico asistido por computadora (robot): 876.1500 lo agrupa con endoscopios, pero es quirúrgico | NAY |
| `regulation:880.2805` | no | Indicador biológico de esterilización | OWP |
| `product_code:PSN` | sí | Dermatoscopios autorizados bajo este código (510(k) K192829, K213957, K230448); 878.4580 es Subpart E | PSN |
| `regulation:880.2806` | no | Indicador biológico de esterilización | QVB |

Sin regulación: 193 product codes entran por panel in vitro; 737 quedan fuera (panel no in vitro o sin clasificación publicada). Subpartes no verificadas: QNU (874.6000), QZC (874.6010), SEZ (892.8500), SHE (892.8200), SHO (882.2000).

La lista completa, código por código con nombre, panel, clase, regulación, regla y motivo: `tools/terminology-import/diagnostic-devices/us/out/fda-product-codes.json`.

### Tipos con más registros

| Product code | Nombre FDA | Registros |
|---|---|---|
| LLZ | System, Image Processing, Radiological | 4 326 |
| GCJ | Laparoscope, General & Plastic Surgery | 4 313 |
| IYO | System, Imaging, Pulsed Echo, Ultrasonic | 3 875 |
| IYN | System, Imaging, Pulsed Doppler, Ultrasonic | 3 823 |
| ITX | Transducer, Ultrasonic, Diagnostic | 3 603 |
| DXN | System, Measurement, Blood-Pressure, Non-Invasive | 2 841 |
| DQY | Catheter, Percutaneous | 2 261 |
| FLL | Continuous Measurement Thermometer | 2 228 |
| DQX | Wire, Guide, Catheter | 2 199 |
| DQA | Oximeter | 2 154 |
| LNH | System, Nuclear Magnetic Resonance Imaging | 2 012 |
| HRX | Arthroscope | 1 942 |
| JAK | System, X-Ray, Tomography, Computed | 1 900 |
| DYB | Introducer, Catheter | 1 841 |
| JJX | Single (Specified) Analyte Controls (Assayed And Unassayed) | 1 647 |
| NBW | System, Test, Blood Glucose, Over The Counter | 1 390 |
| JJY | Multi-Analyte Controls, All Kinds (Assayed) | 1 314 |
| MOS | Coil, Magnetic Resonance, Specialty | 1 225 |
| DQO | Catheter, Intravascular, Diagnostic | 1 127 |
| MQB | Solid State X-Ray Imager (Flat Panel/Digital Imager) | 1 118 |
| MUH | System, X-Ray, Extraoral Source, Digital | 1 116 |
| EHD | Unit, X-Ray, Extraoral With Timer | 1 106 |
| DPS | Electrocardiograph | 1 039 |
| JIT | Calibrator, Secondary | 1 015 |
| MHX | Monitor, Physiological, Patient(With Arrhythmia Detection Or Alarms) | 1 001 |
| CGA | Glucose Oxidase, Glucose | 945 |
| DQK | Computer, Diagnostic, Programmable | 945 |
| KNW | Instrument, Biopsy | 944 |
| KPS | System, Tomography, Computed, Emission | 941 |
| LON | System, Test, Automated, Antimicrobial Susceptibility, Short Incubation | 935 |
| CCK | Analyzer, Gas, Carbon-Dioxide, Gaseous-Phase | 934 |
| JKA | Tubes, Vials, Systems, Serum Separators, Blood Collection | 919 |
| GXY | Electrode, Cutaneous | 911 |
| EGZ | Holder, Film, X-Ray | 833 |
| GKZ | Counter, Differential Cell | 824 |
| LIT | Catheter, Angioplasty, Peripheral, Transluminal | 821 |
| JIX | Calibrator, Multi-Analyte Mixture | 785 |
| JAA | System, X-Ray, Fluoroscopic, Image-Intensified | 780 |
| HET | Laparoscope, Gynecologic (And Accessories) | 771 |
| DSI | Detector And Alarm, Arrhythmia | 744 |

### Fabricantes con más registros

| Fabricante (clave normalizada) | Registros |
|---|---|
| TRACEY HOLEVAS | 2 537 |
| SIEMENS HEALTHCARE DIAGNOSTICS | 2 535 |
| ABBOTT LABORATORIES | 1 488 |
| BECKMAN COULTER | 1 488 |
| ISOMEDIX OPERATIONS | 1 296 |
| ORTHO CLINICAL DIAGNOSTICS | 1 267 |
| KARL STORZ ENDOSCOPY AMERICA | 1 156 |
| STERIGENICS U S | 1 115 |
| SHAYLEE MASILUNAS | 1 096 |
| SIEMENS MEDICAL SOLUTIONS | 1 065 |
| BOSTON SCIENTIFIC | 1 038 |
| AMY NELSON | 936 |
| JAMES CLIFFORD | 841 |
| BIOMERIEUX | 835 |
| INSTRUMENTATION LABORATORY | 815 |
| RANDOX LABORATORIES | 790 |
| MASIMO | 738 |
| STERIGENICS | 691 |
| DIAMOND DIAGNOSTICS | 683 |
| BECTON DICKINSON AND | 680 |
| BIO RAD LABORATORIES | 655 |
| SIEMENS HEALTHINEERS | 652 |
| ROCHE DIAGNOSTICS | 644 |
| DAVID LENNARZ | 606 |
| PHILIPS MEDIZIN SYSTEME BOEBLINGEN | 575 |
| GE MEDICAL SYSTEMS INFORMATION TECHNOLOGIES | 561 |
| NOVA BIOMEDICAL | 545 |
| JERRY DOANE | 531 |
| HEALGEN SCIENTIFIC | 511 |
| GE MEDICAL SYSTEMS | 507 |
| MIDMARK | 503 |
| PHILIPS ULTRASOUND | 490 |
| HOLOGIC | 474 |
| BD BECTON DICKINSON VACUTAINER SYSTEMS PREANALYTIC | 463 |
| GE MEDICAL SYSTEMS ULTRASOUND AND PRIMARY CARE DIAGNOSTICS | 454 |
| ANJA FAIR | 450 |
| SYVA | 442 |
| COVIDIEN | 431 |
| HELENA LABORATORIES | 431 |
| ROBERT PHILLIPS | 430 |

### Clase de riesgo y estado

Clase: `fda:2` 148 531 · `fda:1` 37 216 · `fda:3` 1 741 · `fda:U` 615 · `sin clase` 492 · `fda:N` 471 · `fda:f` 6.

Estado (verbatim de la fuente): sin estado 111 101 · Substantially Equivalent 71 726 · In Commercial Distribution 2 923 · Approved 1 369 · Accepted 1 068 · De Novo Granted 240 · Not in Commercial Distribution 207 · Approved - Reclassified 123 · Approved - Withdrawn 78 · Substantially Equivalent - Kit 73 · SN 55 · Substantially Equivalent - With Limitations 44.

### Huecos

| Fuente | URL | Motivo |
|---|---|---|
| `fda-gudid` | https://accessgudid.nlm.nih.gov/download/delimited | 403 del proxy — GUDID completo inaccesible; sólo se usó el subconjunto dental del Full Release 2025-05-01 (espejo Delapro/GUDID). Faltan los demás paneles. |
<!-- coverage:end -->
