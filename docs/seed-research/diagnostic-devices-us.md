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

> **Actualización 2026-10-24 (pasada 11):** el propietario habilitó `api.fda.gov`, `download.open.fda.gov`, `accessgudid.nlm.nih.gov`, `www.accessdata.fda.gov` y `www.fda.gov` (sondeo: 404 en la raíz de la API, 200, 200, 302, 200). Lo que sigue describe la red de las pasadas 1 a 10.

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
| 5 | 2026-10-24 | FDA **Establishment Registration & Device Listing**, archivos planos 2024 (`Registration.txt` 46 496, `registration_listing.txt` 325 731, `Listing_PCD.txt` 316 023, `Owner_Operator.txt`), espejo `sdgoldberg/MedDev@6cbd231b` · **LIVD SARS-CoV-2** de CDC (pruebas IVD con EUA de FDA; 1 144 filas; se descartan 4 kits sin `Manufacturer`, 3 de ellos filas de prueba de la planilla `Test_*_Device`), `CDCgov/routes@e2e16eed` · extracto de la base **CLIA** de FDA (20 832 filas documento → sistema de prueba → analito, 2025-03), `unmtransinfo/cfde-biomarkers@9a121841` | 111 097 (110 614 listados de establecimiento por product code + 483 kits de prueba con EUA, 7 con UDI-DI) · además: 2 218 autorizaciones con analitos CLIA | 5 755 | 471 | GUDID `device.txt` ~2020-02 de `misterrPink1/symmetric@a43a1a58` (2 424 295 dispositivos **sin product code**: decidir el alcance exigiría cruzar por nombre, prohibido); extracto GUDID 2026-07-23 de `russellmiller49/Interventional-Pulm-Education-Project@b18a0f5b` (15 229, sin product code, mismo motivo); UDI de audífonos de `SyneticSLZ/MarketIntel@13c86b7b` (874.3300, prótesis: fuera de alcance); muestras de 100 a 1 000 filas (`mgree/ffs`, `AmitXShukla/P2P.ai`, `ikmdev/tinkar-core`); EUA COVID 2020 de `TommyJones/covid_fda_eua_tests` (59, contenidas en LIVD); `datasets.zip` de `symmetric` es MDALL de Health Canada (se pasó a la sesión ROW) |
| 6 | 2026-10-24 | **MAUDE** (openFDA `device/event`, recibidos 2026-09-01 a 2026-10-13, 62 533 filas de dispositivo), `Tonystathoulis/Medical-Device-Safety-Intelligence@d20a9fa8` · **retiros** openFDA `device/enforcement`+`recall` 2012-06 a 2026-09 (40 057 productos), `Sarath-Venkatesan/fda-device-recalls-analytics@3e485d48` · openFDA `device/recall` 2026-10-07 (1 794; CC0), `hxlvvm/RecallTrace@ffe8177d` | 15 028 (13 692 retiros por número Z + 1 336 combinaciones marca/modelo de MAUDE) | 304 | 943 | `hsh20020209-cell/fda-recall-qa-decision-support` (eventos agregados con texto «limpio», no el registro por producto); `wcedmisten/510k.fyi` (510(k) sin solicitante, hasta 2024-01: nada nuevo); `danielw4/device-recall-warehouse` (sólo K-number y product code); `akshay-ak-pradhan/fda-maude-data` (sin product code por modelo y «No license is granted»); `HazyResearch/icij-maude` (2 × 1 000 filas ~2014, sin product code); MAUDE de robot da Vinci, rehabilitación y cemento óseo (fuera de alcance). En MAUDE el espejo cambió ® y ™ por «¿»: se conserva verbatim |
| 7 | 2026-10-24 | MAUDE de product codes de dispositivos con IA (21 923 informes recibidos 2020-01 a 2026-04; CC BY 4.0), `hayden-farquhar/MAUDE-AI-Devices@355566d7` · listas FDA de IA `Adaezethetechie/FDA-AI-Medical-Devices-Analysis@64a8b462` (1 524), `neelchauhan332/healthcare-ai-fda-clearances@55f7adb5` (557), `GigHz-com/fda-aiml-devices-dataset@1995f98a` (1 430) | 1 391 combinaciones marca/modelo de MAUDE (ECG, ecografía, monitores, CAD/PACS…) | 49 | 802 | Las tres listas de IA: todos sus envíos ya estaban (0 nuevos); columnas `matched_*` del extracto MAUDE-AI (cruce del autor por nombre, no es dato de FDA: no se usan); `DorothyOteng/FDA-MAUDE-Analysis` (12 294 informes «limpiados» con `Unknown` y `SAME AS ABOVE` en lugar de los valores, y combinaciones incoherentes: no es verbatim); `jdonaldson/gudid-explorer` (formato binario propio, quirúrgico/ortopédico); `medical-device-design/medical-device-kg-pipeline` (datos en apps.okn.us, bloqueado); `wang177777/fda-ai-clinical-function-annotations` (sin product code) |
| 8 | 2026-10-24 | Más extractos MAUDE (encontrados con la búsqueda de repositorios de GitHub): openFDA `device/event` 1991–2010 (30 000 informes, `device` aplanado), `arpan2217/medical-device-adverse-events@c2096e3e` · cardiovascular 2024 (108 265), `sarcom2/fda-device-events-elt@d7e08df3` · archivos masivos MAUDE 2022–2024 (500 000 filas), `levisw/FDA-Medical-Device-Failure-Classification@728544bf` | 10 203 combinaciones marca/modelo/fabricante (620 se sumaron a combinaciones ya existentes) | 709 | 8 165 | MAUDE de clavos de fractura y de robots de rodilla/cadera de `MightyAli98` (ortopedia, fuera de alcance); `Yogendra-Kanchapu` (MAUDE 2023 sin product code: alcance indecidible); `bogdan-alexander/fda-maude-intelligence` (sin marca ni modelo); muestras de 200–5 840 informes (`NainicaD/Vigil-MD`, `MedTraceAI`, `sdr9`, `Parsavafaei26`, `Manas103`, `luisavgonzalez27`, `giillbertt`, `BrandyBrandt`); `d8557379/FDA_510K_streamlit_app` (510(k) de 2026-08: contenido en pasada 2); `AmatSaw04` (valores imputados); repos sintéticos (`basil-sys`, `mnemalur`, `Zeinab-Razmi`) |
| 9 | 2026-10-24 | Búsqueda de repositorios de GitHub (≈60 consultas: MAUDE por categoría diagnóstica, GUDID, openFDA, R&L, EUA) y búsqueda web | **0** | 0 | 0 | `ivitskiy/hearingindex-data@ce1295f8` (34 audífonos de venta libre QUG/QUH/QUF/SCR, 874.33xx: prótesis, fuera de alcance; valores curados, no registros crudos); repos sólo de código (`batharr41/LotCheck-Engine`, `oxford-pharmacoepi/AccessGUDID`, `acarter881/accessgudid*` y otros 17); agregados sin filas por modelo (`JtrunzPHP/maude-monitor`, `Jeneidi/recallradar`, `jmaho24/maude-dashboard`); la búsqueda de GitHub cortó con 429 y no se insistió |
| 10 | 2026-10-24 | Vías independientes: hosts oficiales FDA/NLM (vuelven a dar 403), proyectos de GitLab (`openfda`, `gudid`, `maude`, `510k`, `fda device`), paquetes PyPI (`pymaude`, `maude`, `pyfda` y 14 nombres más), búsqueda de conda | **0** | 0 | 0 | GitLab: sólo clientes de API de medicamentos y código (`OrenSource/gudid-go`, `leapbase/OpenFDAExplorer`, `f.veggeberg/open-fda-project`: ningún archivo de datos > 200 KB); PyPI: `pymaude` sin datos, `maude` y `pyfda` son otra cosa; la API de búsqueda de conda devuelve 403 |
| 11 | 2026-10-24 | **Fuentes oficiales** (el propietario habilitó los hosts FDA/NLM): openFDA `device/classification`, `510k`, `pma`, `registrationlisting` y `udi` export 2026-10-21 (`fetch-official.mjs`, 58 archivos con sha256) y AccessGUDID Delimited Full Release 20261001 (bajado y probado; no se usa en el build porque openFDA `udi` es el mismo GUDID y más nuevo). Prioridad oficial > espejo. | **631 967 UDI-DI** (`fda-gudid`, de 3 130 a 635 097) + **104 PMA**; R&L: las 110 614 filas del espejo 2024 se reemplazan por 361 369 oficiales (id distinto: `registro|product code|nombre propietario` en vez de `registro|KEY_VAL|product code`; no son comparables 1 a 1) | 3 578 | 212 071 | Ninguna fuente descartada. 3 848 product codes fuera de alcance (igual que antes). 510(k)/De Novo: 0 nuevos (el oficial ya estaba cubierto por los espejos; ahora 72 175 filas tienen procedencia oficial y los espejos quedan en `extra.alsoIn`) |

**Saturación:** las pasadas 9 y 10 aportan 0 → se cumple el corte de «dos pasadas seguidas sin aportes» con la red de esta sesión. Lo que falta está detrás de hosts bloqueados (tabla «Huecos»). Si el propietario habilita los dominios FDA/NLM, la próxima pasada empieza por `fetch-official.mjs --gudid-delimited` (GUDID completo y nombres propietarios del R&L).

**Pasada 11 (fuentes oficiales):** con los hosts FDA/NLM habilitados, `manifest.json → gaps` queda vacío. MAUDE, retiros, LIVD, CLIA, NAAT y la lista de IA siguen viniendo de espejos (esta región no tiene descargador oficial para ellas).

<!-- coverage:start -->
## Cobertura (generada por `coverage-report.mjs`)

| | Cantidad |
|---|---|
| Registros (filas del NDJSON) | 1 098 516 |
| · `fda-gudid` | 635 097 |
| · `fda-rl` | 361 369 |
| · `fda-510k` | 71 955 |
| · `fda-recall` | 13 692 |
| · `fda-maude` | 12 930 |
| · `fda-pma` | 2 750 |
| · `cdc-livd-sars-cov-2` | 483 |
| · `fda-denovo` | 240 |
| UDI-DI (con modelo/versión) | 635 104 |
| Fabricantes distintos (razón social normalizada exacta) | 20 148 |
| Marcas distintas (fabricante + nombre comercial) | 293 608 |
| Registros con país del fabricante | 433 564 |
| Product codes vistos / incluidos / excluidos | 7 118 / 3 270 / 3 848 |

### Product codes por panel (incluidos / excluidos)

| Panel | Incluidos | Excluidos | Registros de equipos |
|---|---|---|---|
| CH — Clinical Chemistry | 563 | 1 | 102 643 |
| MI — Microbiology | 549 | 0 | 43 719 |
| HE — Hematology | 405 | 23 | 54 713 |
| IM — Immunology | 314 | 0 | 21 160 |
| TX — Clinical Toxicology | 287 | 0 | 54 030 |
| CV — Cardiovascular | 199 | 266 | 327 368 |
| GU — Gastroenterology, Urology | 170 | 455 | 130 367 |
| PA — Pathology | 156 | 0 | 58 838 |
| RA — Radiology | 140 | 75 | 108 635 |
| OP — Ophthalmic | 123 | 213 | 12 487 |
| AN — Anesthesiology | 82 | 171 | 23 282 |
| OB — Obstetrics/Gynecology | 81 | 196 | 51 692 |
| NE — Neurology | 71 | 211 | 31 626 |
| EN — Ear, Nose, Throat | 41 | 219 | 14 401 |
| HO — General Hospital | 23 | 325 | 11 744 |
| DE — Dental | 22 | 333 | 5 189 |
| PM — Physical Medicine | 13 | 214 | 15 442 |
| OR — Orthopedic | 12 | 322 | 25 631 |
| SU — General, Plastic Surgery | 11 | 595 | 4 971 |
| MG — Medical Genetics | 8 | 0 | 95 |
| sin panel publicado | 0 | 229 | 0 |

### Criterio: subpartes de 21 CFR incluidas y excluidas

| Parte.subparte | Título | ¿Entra? | Product codes |
|---|---|---|---|
| 862.1xxx | Subpart B — Clinical Chemistry Test Systems | sí | 436 |
| 862.2xxx | Subpart C — Clinical Laboratory Instruments | sí | 91 |
| 862.3xxx | Subpart D — Clinical Toxicology Test Systems | sí | 271 |
| 864.1xxx | Subpart B — Biological Stains | sí | 148 |
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
| 868.5xxx | Subpart F — Therapeutic Devices | no | 134 |
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

Sin regulación: 189 product codes entran por panel in vitro; 737 quedan fuera (panel no in vitro o sin clasificación publicada). Subpartes no verificadas: QNU (874.6000), QZC (874.6010), SEZ (892.8500), SHE (892.8200), SHO (882.2000).

La lista completa, código por código con nombre, panel, clase, regulación, regla y motivo: `tools/terminology-import/diagnostic-devices/us/out/fda-product-codes.json`.

### Tipos con más registros

| Product code | Nombre FDA | Registros |
|---|---|---|
| OEZ | Cardiovascular Procedure Kit | 71 476 |
| FDE | Laparoscopy Kit | 34 136 |
| GCJ | Laparoscope, General & Plastic Surgery | 31 151 |
| OEQ | Angiography/Angioplasty Kit | 27 789 |
| NJT | Immunohistochemistry Reagents And Kits | 26 783 |
| OHD | Gynecological Laparoscopic Kit | 23 809 |
| MVU | Reagents, Specific, Analyte | 23 342 |
| DQY | Catheter, Percutaneous | 21 937 |
| DYB | Introducer, Catheter | 19 938 |
| LIT | Catheter, Angioplasty, Peripheral, Transluminal | 18 522 |
| OES | Cardiac Catheterization Kit | 15 558 |
| NBH | Accessories, Arthroscopic | 15 296 |
| ITX | Transducer, Ultrasonic, Diagnostic | 14 693 |
| NWU | Endoscope Introducer Kit | 14 312 |
| DQA | Oximeter | 14 047 |
| DSA | Cable, Transducer And Electrode, Patient, (Including Connector) | 13 390 |
| OHM | Cesarean Section Tray | 13 382 |
| DXQ | Blood Pressure Cuff | 12 585 |
| IKD | Cable, Electrode | 12 543 |
| IYN | System, Imaging, Pulsed Doppler, Ultrasonic | 11 387 |
| DQO | Catheter, Intravascular, Diagnostic | 11 275 |
| IYO | System, Imaging, Pulsed Echo, Ultrasonic | 10 698 |
| LLZ | System, Image Processing, Radiological | 10 622 |
| PPM | General Purpose Reagent | 9 934 |
| HRX | Arthroscope | 9 407 |
| DQX | Wire, Guide, Catheter | 9 152 |
| DXN | System, Measurement, Blood-Pressure, Non-Invasive | 9 083 |
| KNW | Instrument, Biopsy | 7 027 |
| GXY | Electrode, Cutaneous | 6 892 |
| FLL | Continuous Measurement Thermometer | 6 845 |
| JJX | Single (Specified) Analyte Controls (Assayed And Unassayed) | 6 478 |
| MHX | Monitor, Physiological, Patient(With Arrhythmia Detection Or Alarms) | 6 433 |
| GYC | Electrode, Cortical | 5 773 |
| LNH | System, Nuclear Magnetic Resonance Imaging | 5 308 |
| JAK | System, X-Ray, Tomography, Computed | 5 021 |
| MNL | Accessories, Cleaning Brushes, For Endoscope | 5 009 |
| DQK | Computer, Diagnostic, Programmable | 4 940 |
| MOS | Coil, Magnetic Resonance, Specialty | 4 902 |
| DPS | Electrocardiograph | 4 866 |
| FMH | Container, Specimen, Sterile | 4 662 |

### Fabricantes con más registros

| Fabricante (clave normalizada) | Registros |
|---|---|
| 798788741 | 3 |
| 823404997 | 8 |
| CARDINAL HEALTH 200 | 111 718 |
| MEDLINE INDUSTRIES | 75 862 |
| ROCHE DIAGNOSTICS OPERATIONS | 25 582 |
| GE HEALTHCARE TECHNOLOGIES | 20 061 |
| PHILIPS MEDICAL SYSTEMS INTERNATIONAL | 17 283 |
| ABBOTT LABORATORIES | 14 380 |
| MEDTRONIC | 14 119 |
| MERIT MEDICAL SYSTEMS | 13 599 |
| SIEMENS HEALTHCARE DIAGNOSTICS | 13 078 |
| UNIMED MEDICAL SUPPLIES | 12 017 |
| HANGZHOU ALLTEST BIOTECH | 10 170 |
| SOTERA HEALTH | 10 015 |
| BECTON DICKINSON AND | 9 476 |
| BECKMAN COULTER | 9 402 |
| AGILENT TECHNOLOGIES | 7 494 |
| NIHON KOHDEN | 7 292 |
| SMITH AND NEPHEW | 7 278 |
| AVID MEDICAL | 7 196 |
| APK TECHNOLOGY | 6 603 |
| BOSTON SCIENTIFIC | 6 521 |
| THERMO FISHER SCIENTIFIC | 6 324 |
| PMT | 6 095 |
| STRYKER | 6 055 |
| BEIJING DEMAX MEDICAL TECHNOLOGY | 5 724 |
| BIO SB | 5 529 |
| ELMED | 5 415 |
| COOK | 5 373 |
| CORDIS | 5 285 |
| WELCH ALLYN | 5 251 |
| MEDIVATORS | 5 200 |
| AMERICAN CONTRACT SYSTEMS | 5 180 |
| TELEFLEX | 4 642 |
| KARL STORZ AND KG | 4 545 |
| AMERICAN DIAGNOSTIC | 4 404 |
| BROSMED MEDICAL | 4 385 |
| MICROBIOLOGICS | 4 308 |
| STERIS | 4 141 |
| QUIDELORTHO | 4 117 |

### Clase de riesgo y estado

Clase: `fda:2` 837 968 · `fda:1` 248 761 · `fda:3` 5 557 · `fda:U` 3 951 · `fda:N` 1 750 · `sin clase` 495 · `fda:f` 34.

Estado (verbatim de la fuente): In Commercial Distribution 576 638 · sin estado 374 782 · Substantially Equivalent 71 726 · Not in Commercial Distribution 58 459 · Terminated 8 288 · Ongoing 4 983 · APPR 1 446 · OK30 1 068 · Unknown 396 · Completed 281 · APRL 141 · Open, Classified 140.

### Huecos

| Fuente | URL | Motivo |
|---|---|---|
<!-- coverage:end -->
