# Fuentes de `master/` (equipos de diagnóstico, consolidación)

Fecha de consulta de todo lo de abajo: **2026-10-24**. Las fuentes de cada
región (FDA, EUDAMED, MHRA, Swissmedic, resto del mundo) están en el
`SOURCES.md` de `us/`, `eu/` y `row/`; acá solo lo que usa `master/` por su
cuenta y los criterios publicados de la taxonomía.

## 1. Archivos de datos (fijados por commit y sha256)

Desde este entorno los servidores oficiales no responden (ver §4), así que se
usan copias en git que reproducen el archivo oficial **con su cabecera
original**. `fetch-sources.mjs` rechaza cualquier archivo cuyo sha256 no
coincida.

| Fuente (`source`) | Archivo oficial | Copia usada | sha256 | Filas | Licencia |
|---|---|---|---|---:|---|
| `fda-pcd` | FDA Product Classification Database, `foiclass` ([página de descarga](https://www.fda.gov/medical-devices/classify-your-medical-device/download-product-code-classification-files); se reemplaza cada domingo) | `github.com/ej86/fda-ai-medical-device-analytics` @ `8840a03632ffdc346a8bf05a459236c913b9198c` (2026-08-28), `foiclass.csv` | `ed54a12fe6ff0a5208146f1ec5829d248eac9b1dfec231db9677cc633d5b13de` | 7 088 | Obra del Gobierno de EE. UU.: dominio público (17 U.S.C. § 105). El repositorio no declara licencia propia; se usa solo el dato público de la FDA. |
| `fda-ai-enabled-devices` | FDA, [Artificial Intelligence-Enabled Medical Devices](https://www.fda.gov/medical-devices/software-medical-device-samd/artificial-intelligence-enabled-medical-devices) (CSV de la página) | mismo commit, `aiml-devices-csv.csv` | `4da0d15a1dcc7b6a7d45364f243e85aa4407ba3b63b6922a16fdbf96fea0d41d` | 1 524 | Ídem. La FDA aclara que la lista no es exhaustiva. |
| `fda-pcd` (suplemento) | ídem `fda-pcd`, refresco 2026-10-20 | `github.com/bjoleary/fdadata` @ `227bdaa24aec8565e333cc67689ff2c63ce5cea7` (2026-10-20), `data/product_codes.rda` | `4423c192af7a282af72270f0e732e83a58504e083b6c9d588a7356b228f3894b` | 9 | MIT (repositorio); datos de la FDA. **No es literal**: bjoleary limpia el archivo (paneles por nombre, regulación numérica). Solo se usan los 9 códigos que faltan en la copia literal, extraídos con `extract-pcd-supplement.py` a `data/fda-pcd-supplement.json`. |
| `ec-emdn` | Comisión Europea, [EMDN](https://health.ec.europa.eu/medical-devices-topics-interest/european-medical-devices-nomenclature-emdn_en), versión 2 | `github.com/BatirMedical/nomenclature-emdn` @ `e0131762b3385c1085b97da9c5f74d32edb89df3` (2025-04-02), `EMDN_BatirMedical.csv` | `7972865360a3d8d61dcf6b2e4969e107a0413768febfd3f24ec00302d954e379` | 8 453 | La Comisión la publica libre y gratuita; el repo es MIT y aclara que los datos siguen siendo de la Comisión. |
| `ec-emdn` (verificación) | ídem | `github.com/lisadonlon/GMDNEMDN` @ `ef6086489b942d96ff0d2e18f9f1f8434a94f954` (2025-10-30), `data/EMDN.txt` | `033572eb47bb3f595c3fd9b1e8494680fd2dd189c4ee21261b4d64e3cab26f3f` | 8 454 | Ídem (MIT). Solo para verificar la primera copia: coinciden código, término y nivel en los 8 453 comunes; `V020303` (TEATS) falta en la primera y se toma de esta, citándola. |

Cabeceras verificadas: `foiclass` trae las 18 columnas publicadas
(`REVIEW_PANEL|MEDICALSPECIALTY|PRODUCTCODE|DEVICENAME|DEVICECLASS|…|SummaryMalfunctionReporting`);
la lista de IA, `Date of Final Decision,Submission Number,Device,Company,Panel (Lead),Primary Product Code`.
La última decisión de la copia es del 2026-03-30: la lista oficial de
septiembre de 2026 tiene más registros (hueco §4).

Cada fila de la lista de IA cita la ficha pública de su presentación, armada
con el patrón de la FDA para ese tipo de número (`cfpmn/pmn.cfm?ID=K…`,
`cfpmn/denovo.cfm?id=DEN…`, `cfpma/pma.cfm?id=P…`); `sourceVersion` es el
commit de la copia.

## 2. Criterios publicados de la taxonomía

| Qué decide | Fuente citada |
|---|---|
| Subpartes «Diagnostic Devices» / «Monitoring Devices» y sus rangos de secciones, parte por parte (868, 870, 872, 874, 876, 878, 880, 882, 884, 886, 888, 890, 892) | Tablas de contenidos del eCFR y del Cornell LII; la URL de cada subparte está en `lib/cfr.mjs` (p. ej. <https://www.ecfr.gov/current/title-21/chapter-I/subchapter-H/part-892/subpart-B>, <https://www.law.cornell.edu/cfr/text/21/part-870/subpart-C>) |
| Partes IVD 862, 864, 866 | 21 CFR 809.3(a), definición de «in vitro diagnostic products» (<https://www.law.cornell.edu/cfr/text/21/809.3>), y los títulos de las partes en el eCFR |
| Subpartes J y K de la 864 fuera del catálogo (establecimientos de sangre y HCT/P) | <https://www.law.cornell.edu/cfr/text/21/part-864> |
| Desde x.3000: subpartes de prótesis, cirugía, terapéuticos y misceláneos | eCFR / Cornell LII de las partes 870, 872, 874, 878, 880, 884, 886, 890 y 892; lista de subpartes del capítulo para 876, 882 y 888 (<https://www.ecfr.gov/current/title-21/chapter-I/subchapter-H>) |
| Paneles IVD para códigos sin regulación | Medido en el propio `foiclass` (`derivePanelParts`): un panel es IVD solo si **todos** sus códigos con regulación están en 862/864/866. Hoy: IM, MG, PA, TX. CH, HE y MI tienen algún código fuera de esas partes y no cuentan. |
| EMDN categoría W = IVD; Z11/Z12 mezclan diagnóstico y terapia | MedTech Europe, *Practical guide to the use of the EMDN* (2025): <https://www.medtecheurope.org/wp-content/uploads/2025/05/250522_medtech-europe_emdn-booklet-final2.pdf>; MDCG 2025-2 y 2026-1 (actualizaciones de la EMDN) |
| Estructura del código EMDN (letra de categoría, grupo de 2 dígitos, niveles de 2 dígitos) | Misma guía; ejemplo publicado `W0101060101` (tiras de glucosa) |

No se usaron listas de paneles ni de tipos de presentación escritas de memoria:
los nombres de los paneles de la FDA y el significado de `SUBMISSION_TYPE_ID`
no pudieron verificarse desde acá, así que se guardan los códigos tal cual.

## 3. Licencias y términos por nomenclatura

| Nomenclatura | Uso que se hace | Licencia / términos |
|---|---|---|
| FDA product codes | Completa (7 088 códigos, con definición) | Dominio público. |
| EMDN | Completa (V2, 8 454 términos, desde dos copias verificadas entre sí) más los códigos que traen los registros y no están en V2 (hoy `W0105040619`, de EUDAMED vía `eu/`, sin nombre publicado) | La Comisión la publica libre y gratuita (MDR art. 26; descarga en <https://webgate.ec.europa.eu/dyna2/emdn/>). |
| GMDN | Solo los términos que AccessGUDID publica junto a cada dispositivo (nombre, definición y, desde su actualización, el código) | La nomenclatura completa exige membresía de la GMDN Agency (<https://www.gmdnagency.org/>). No se descarga ni se reconstruye la nomenclatura: solo lo que GUDID publica por dispositivo. |
| Correspondencia EMDN↔GMDN | **No hay** mapeo oficial publicado: la Comisión dijo que lo haría «to the extent possible» y el estudio de la GMDN Agency (2023) concluye que el mapeo término a término no es efectivo (solo 26 % de correspondencia cercana). No se usa ningún mapeo EMDN↔GMDN. | <https://www.gmdnagency.org/wp-content/uploads/2023/09/Feasibility-of-mapping-GMDN-to-EMDN-article.pdf> |
| Product code ↔ GMDN | Solo el que declara una misma UDI-DI en GUDID (salida de `us/`), con cuántos registros lo declaran | Ídem GUDID. |

Identificadores de fabricante: solo los que publica una fuente (SRN de
EUDAMED, FEI y número de registro de la FDA, CNPJ, sponsor ARTG, …). GLEIF
(LEI, licencia CC0) y Wikidata (CC0) servirían para grupos y filiales, pero no
responden desde este entorno (§4); el resolvedor ya acepta sus relaciones
como entrada (`groupLinks`). OpenCorporates no se usó: su API exige clave y sus datos se
licencian con ODbL (atribución y share-alike), lo que habría que acordar antes
de mezclarlos con el catálogo.

## 4. Huecos (lo que no se pudo obtener y por qué)

| Qué | Dónde | Motivo |
|---|---|---|
| `foiclass.zip` oficial, openFDA (`api.fda.gov`, `download.open.fda.gov`), AccessGUDID (`accessgudid.nlm.nih.gov`) | FDA / NLM | 403 del proxy de salida del entorno (CONNECT rechazado); WebFetch tampoco resuelve DNS. Se usó la copia fijada de §1. |
| Archivo EMDN oficial (y versiones posteriores a la 2) | `webgate.ec.europa.eu/dyna2/emdn/` | 403 del proxy. Se usó la V2 de dos copias en git (§1); no se encontró copia de una versión posterior. |
| EUDAMED (actores, SRN) | `ec.europa.eu/tools/eudamed` | 403 del proxy (lo cubre `eu/`). |
| GLEIF, Wikidata, OpenCorporates | `api.gleif.org`, `query.wikidata.org`, `api.opencorporates.com` | 403 del proxy (GLEIF, Wikidata); OpenCorporates sin clave y con licencia ODbL a acordar. Sin grupos/filiales publicados en esta pasada. |
| Dataset del proyecto de mapeo GMDN↔EMDN (Zenodo 13890613) y mapeos GMDN↔EMDN en git (`lisadonlon/GMDNEMDN`, `Kilanopi/GMDNtoEMDN`, `cl-tud/riskman-device-code-validation-scripts`) | `zenodo.org`, GitHub | Zenodo: 403 del proxy. Los de GitHub son mapeos automáticos por similitud de texto, no publicados por una autoridad: no se usan. |
| Lista compilada de 12 275 términos GMDN (`lisadonlon/GMDNEMDN/exports/gmdn-from-gudid`) | GitHub | Es la nomenclatura GMDN compilada y su autor la retiró «for licensing compliance»: no se usa. |
| PCD de la FDA más nuevo (`bjoleary/fdadata`, 2026-10-20, `.rda`) | GitHub | No hay lector de `.rda` en el entorno; lo usa `us/` (7 119 product codes en su `fda-product-codes.json`). |
| Listados de expositores y socios (RSNA, MEDICA, CMEF, WHX, ADLM, ECR, ITEM, KIMES, Hospitalar, Expo MED, FIME; AdvaMed, MedTech Europe, BVMed, VDGH, SPECTARIS, SNITEM, ABHI, Swiss Medtech, JIRA, JACRI, JAIMA, JMOIA, MTJAPAN, ABIMED, CBDL, MTAA, …) | sitios de cada organización | Sin acceso directo (DNS/403). Lo que hay viene de resultados de búsqueda que citan la URL: `data/industry-directories.json`, marcado `method: web-search-snippets`. KMDIA, CAMDI, Fenin, Medtech Canada, MDMA y AiMeD no publican un listado que se haya encontrado (MDMA: solo con inicio de sesión; WHX Dubai: con la entrada de visitante). No se revisaron `robots.txt` ni términos de cada sitio porque no se pudo acceder. |
| Regiones `us`, `eu`, `row` | ramas hermanas | Ver `out/coverage.md`: una región sin `out/manifest.json` empujado queda **pendiente**; `build.mjs` la consolida en cuanto aparezca. |

## 5. Lo que se instaló para validar (no cambia el repo)

`repo.yarnpkg.com` y `cdn.sheetjs.com` responden 403 desde este entorno. Para
correr `typecheck`, `lint` y los tests se usó yarn 4.14.1 desde
`registry.npmjs.org` (`COREPACK_NPM_REGISTRY`) y, solo en la instalación local,
`xlsx@0.18.5` de npm en lugar del tarball de SheetJS; `package.json` y
`yarn.lock` quedaron sin cambios.
