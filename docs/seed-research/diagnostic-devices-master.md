# Equipos de diagnóstico: consolidación mundial (sesión master)

Rama `justin/seed-dx-devices-master` · código en
`tools/terminology-import/diagnostic-devices/master/` · formato común en
`tools/terminology-import/diagnostic-devices/README.md`.

Pedido del propietario: todos los equipos de diagnóstico con todos sus
fabricantes y marcas del mundo, corpus abrumadoramente grande, iterar hasta
que sea imposible encontrar más, sin inventar nada. Esta sesión une las
salidas de las tres sesiones regionales (`us`: FDA; `eu`: EUDAMED, MHRA,
Swissmedic; `row`: resto del mundo) en **tipo de equipo → fabricante → marca →
modelo**, con todos los registros de cada modelo.

## Paso 0: qué tiene el modelo hoy

| Busqué | Encontré |
|---|---|
| Tipos de equipo | `diagnostic_units.diagnostic_equipment.equipment_type_concept_id` (FK a `terminology.catalog_concepts`) y `modality_concept_id`. Los tipos de hoy son 3 conceptos sembrados a mano (`DU_EQ_ANALYZER`, `DU_EQ_XRAY`, `DU_EQ_ULTRASOUND`, `diagnostic_units.concepts.ts`). |
| Fabricante, marca, modelo | `diagnostic_equipment.manufacturer` y `.model`: `varchar` libre (máx. 200 en el DTO). **No hay tabla** de fabricantes, marcas, modelos ni registros sanitarios. |
| GMDN / EMDN / UDI | Ninguna tabla. `procedures_perioperative` acepta UDI-DI/UDI-PI de implantes como texto en el DTO. |
| Módulo 03 `terminology` | `terminology_sources`, `code_systems`, `code_system_versions`, `catalog_concepts`, `concept_designations`, `concept_properties`, `concept_relationships`, `concept_maps`, `value_sets*`, `catalog_import_batches`: alcanza para la **taxonomía** de tipos y sus mapeos publicados. |

Decisión (ADR-0021, sin DDL en la API): la taxonomía se carga en
`terminology.*` (`load-taxonomy.mjs`, idempotente); fabricantes, marcas,
modelos y registros quedan en `out/` (NDJSON gzip con procedencia por fila)
con el importador listo, y la propuesta de tablas va al repo del modelo
(§ Propuesta). Con la taxonomía cargada, cualquier product code de
diagnóstico ya puede usarse como `equipment_type_concept_id`: el value set
`diagnostic-equipment-types` reúne los 3 122 tipos de diagnóstico.

## Taxonomía de tipos de equipo de diagnóstico

Tres nomenclaturas, sin forzar mapeos entre ellas:

- **FDA product codes**: los 7 088 de la Product Classification Database. Son
  de diagnóstico los de las subpartes del 21 CFR tituladas «Diagnostic
  Devices» o «Monitoring Devices» y los de las partes IVD 862/864/866 (21 CFR
  809.3), salvo los de establecimientos de sangre (864 J/K). Sin regulación:
  solo si el panel es «todo IVD» medido en el mismo archivo. Resultado:
  **3 122 tipos de diagnóstico** (2 147 IVD, 777 de diagnóstico, 198 de
  monitoreo), 3 131 no diagnósticos y **835 sin decisión** (831 sin
  regulación de paneles mixtos y 4 secciones más nuevas que la tabla
  verificada), que quedan aparte para revisión.
- **EMDN**: categoría W = IVD. Z11 (bioimagen y radioterapia) y Z12
  (exploraciones funcionales e intervenciones terapéuticas) mezclan
  diagnóstico y terapia: sin decisión salvo por mapeo publicado. Jerarquía por
  la estructura publicada del código; los ancestros sin nombre publicado
  quedan con el código como etiqueta.
- **GMDN**: solo lo que GUDID publica por dispositivo. Decide por el mapeo
  publicado (product code + GMDN de la misma UDI-DI), y solo si todos los
  destinos coinciden.

**No existe** una correspondencia EMDN↔GMDN publicada por la Comisión
(prometida «to the extent possible»; el estudio de la GMDN Agency de 2023 la
desaconseja): no se usa ninguna.

## Resolución de fabricantes

`lib/manufacturers.mjs`. Normalización (solo para comparar): NFKC, sin
diacríticos, mayúsculas, `&` → AND, sin puntuación, sin THE inicial y sin
sufijos societarios (más de 100 formas: INC, LLC, GMBH & CO KG, S.A. DE C.V.,
CO., LTD., KABUSHIKI KAISHA, 株式会社, 有限公司, 주식회사…). Fusiones, cada
una con regla y evidencia en `manufacturers.ndjson.gz`:

1. `same-registry-id`: mismo id publicado (SRN, FEI, registro FDA, LEI, CNPJ…).
2. `same-name-same-country`: misma clave y mismo país.
3. `same-name-unique-country`: una mención sin país y la clave aparece con un
   solo país en todo el corpus.
4. `same-name-no-country`: misma clave y ninguna mención con país.

No se fusiona (va a `review-manufacturers.ndjson.gz`): dos LEI o dos SRN
distintos con el mismo nombre, el mismo nombre en países distintos (posible
grupo) y la misma primera palabra distintiva (posible grupo). Grupos y
filiales solo por relaciones publicadas (GLEIF nivel 2, Wikidata P749/P355),
que enlazan sin fusionar. No se translitera (Sysmex ≠ シスメックス sin un id
que lo pruebe).

## Protocolo de saturación: pasadas

Cada pasada: `git fetch origin`, mirar las ramas hermanas, sumar fuentes,
`build.mjs`, registrar acá lo nuevo **después de deduplicar**, `git push`. Se
detiene con dos pasadas seguidas en 0.

### Pasada 1 (2026-10-24)

- **Regiones**: ninguna rama hermana tiene todavía `out/manifest.json`
  (`us`, `eu`, `row`: pendientes). Avisé a las tres sesiones con el formato
  común y con el dato de red (git clone de GitHub funciona; los registros
  oficiales dan 403).
- **Fuentes nuevas**: FDA Product Classification (7 088 product codes) y la
  lista FDA de dispositivos con IA (1 524 autorizaciones), copias fijadas por
  commit y sha256.
- **Nuevos tras deduplicar**: 3 122 tipos de diagnóstico; **541
  fabricantes**, **1 192 modelos** (en la lista de IA el «modelo» es el nombre
  comercial del dispositivo autorizado; la fuente no separa marca de modelo y
  no se partió), **1 429 registros**; 137 tipos con al menos un modelo; 192
  fusiones `same-name-no-country`; 29 posibles grupos para revisión.
- **Investigación del sector** (asociaciones y ferias): URLs oficiales de los
  listados de RSNA (2021–2026), MEDICA, CMEF, WHX/WHX Labs, ADLM, ECR, ITEM,
  KIMES, Hospitalar, Expo MED, FIME, WHX Cape Town; AdvaMed (y sus divisiones
  de imagen y diagnóstico), MedTech Europe, BVMed, VDGH, SPECTARIS, SNITEM,
  ABHI, Swiss Medtech, JIRA, JACRI, JAIMA, JMOIA, MTJAPAN, ABIMED, CBDL,
  ABIMO, MTAA. Menciones de fabricantes con la URL que las afirma, en
  `data/industry-directories.json`, cruzadas con los fabricantes resueltos.
- **Descartadas** (motivo): sitios oficiales de FDA, NLM, CE, GLEIF, Wikidata,
  Zenodo, Hugging Face y Kaggle (403 del proxy); `pypi.org/search` (página de
  desafío anti-bot: no se elude); escrapers pagos de Apify (servicio pago de
  terceros, sin licencia de reutilización); repositorio
  `selimgokirmak/Map-Your-Show-Supported-Events` (solo URLs de eventos, sin
  empresas).

### Pasada 2 (2026-10-24)

- **Regiones**: `us` consolidada desde `origin/justin/seed-dx-devices-us`
  (`c5efecb6`): 77 971 filas, todas válidas contra el formato común y con el
  sha256 del manifest (fuentes `fda-510k` 71 955, `fda-pma` 2 646,
  `fda-gudid` 3 130 del subconjunto dental, `fda-denovo` 240). `eu` publicó
  su `out/manifest.json` en `origin/claude/adoring-curie-xdkt83` (`14f81a41`)
  con **0 filas** y 11 huecos (403 del proxy en EUDAMED, MHRA, Swissmedic,
  CND, NANDO, BfArM, AEMPS, ANSM). `row`: pendiente.
- **Fuentes nuevas**: EMDN V2 completa, desde dos copias independientes en git
  (`BatirMedical/nomenclature-emdn@e0131762` y `lisadonlon/GMDNEMDN@ef608648`).
  Coinciden en código, término y nivel en los 8 453 códigos comunes; a la
  primera le falta `V020303` (TEATS), que se toma de la segunda, citándola. El
  nivel publicado coincide en todos los códigos con la estructura del código.
- **Criterio EMDN ampliado** (sin palabras clave en nombres de dispositivos):
  además de la categoría W, decide el **título publicado de un grupo** no
  terminal que declara solo diagnóstico o monitoreo (p. ej. `L16 DIAGNOSTIC
  INSTRUMENTS, REUSABLE`, `C0205 CARDIAC DIAGNOSTIC DEVICES`, `Z120302 VITAL
  SIGNS MONITORING INSTRUMENTS`, `Z13 NON-SPECIFIC CONSUMABLES FOR DIAGNOSTIC
  INSTRUMENTS`), y lo heredan sus descendientes. Un título que mezcla
  diagnóstico con intervención o soporte (`Z1103 DIAGNOSTIC AND
  INTERVENTIONAL RADIOLOGY INSTRUMENTS`, `Z1203 INSTRUMENTS TO SUPPORT AND
  MONITOR VITAL SIGNS`) queda sin decisión. Ecografía (`Z1104`) y resonancia
  (`Z1105`) no tienen un título que diga diagnóstico: quedan sin decisión en
  EMDN (en FDA sí se deciden por la subparte 892 B).
- **Nuevos tras deduplicar** (contra la pasada 1): +8 454 nodos EMDN (2 491 de
  diagnóstico: 2 262 W y 229 por título de grupo), +79 GMDN decididos por
  mapeo publicado, +3 product codes que el PCD de la copia no tiene,
  **+218 mapeos publicados** (product code↔GMDN de la misma UDI-DI en GUDID),
  **+12 762 fabricantes** (13 303), **+72 141 modelos** (73 333), **+76 716
  registros** (78 145); 2 428 tipos con al menos un modelo. Fusiones: 798
  `same-name-same-country`, 628 `same-name-unique-country`, 226
  `same-name-no-country`; a revisión, 635 mismo nombre en otro país, 77 país
  ambiguo y 1 562 posibles grupos por primera palabra.
- **Diferencia de criterio con `us`**: `us` recorta con su propio alcance
  (`us/lib/scope.mjs`); con los criterios publicados de master, 742 de sus
  filas no son de diagnóstico y 608 quedan sin decisión (sobre todo los códigos
  sin regulación MDS, MAQ, NCD, OZO, OZP). No entran al catálogo y figuran en
  `coverage.json`.
- **Taxonomía cargada** en el Postgres 16 desechable: EMDN 8 454 conceptos y
  8 431 relaciones is-a, 218 mapeos, 5 692 miembros del value set; 2.ª corrida
  en 0 (`docs/trabajo/2026-10-24-seed-dx-devices-master/evidencia/load-postgres16-pasada2.txt`).
- **Listados del sector**: `data/industry-directories.json` (46
  organizaciones, 552 menciones con URL). Con el corpus de `us`, 130 de 370
  empresas cruzan con un fabricante de los registros; 240 quedan como
  candidatas solo en listados.
- **Avisos a las hermanas**: les pasé a `eu` y `row` las copias públicas en
  git de su región (actores EUDAMED con SRN, `eudamed2firstbase`,
  Swissdamed↔SRN, ANVISA con y sin modelos, aprobaciones PMDA con término
  JMDN, MDALL 2020, DAEN de TGA con término GMDN), y a `us`, el `device.txt`
  completo de GUDID de 2020 y el pedido de poner el GMDN en
  `extra.deviceTypes`.
- **Descartadas** (motivo):
  - `lisadonlon/GMDNEMDN` `exports/gmdn-from-gudid/gmdn-from-gudid-all.csv`
    (12 275 términos GMDN): es la nomenclatura GMDN compilada, y su propio
    autor la retiró de la aplicación «for licensing compliance». GMDN solo
    entra tal como GUDID lo publica en cada dispositivo.
  - Mapeos GMDN↔EMDN de `lisadonlon/GMDNEMDN`, `Kilanopi/GMDNtoEMDN` y
    `cl-tud/riskman-device-code-validation-scripts`: similitud de texto
    automática, no un mapeo publicado por una autoridad.
  - `bjoleary/fdadata` (`foiclass` del 2026-10-20 en `.rda` de R): no hay R ni
    lector de `.rda` en el entorno; queda para la próxima pasada (lo usa `us`).
  - `misterrPink1/symmetric` `device.txt` de GUDID 2020: no trae product code
    ni GMDN, así que sin cruzarlo no hay tipo; se lo pasé a `us`.
  - Nota de método: el agente de búsqueda de espejos usó la búsqueda de código
    de GitHub fuera del repositorio de esta sesión, cosa que no debía; no se
    repite. Los repositorios encontrados son públicos y se bajaron con
    `git clone`.

### Pasada 3 (2026-10-24)

- **Regiones**:
  - `us` @`3ba3358e`: 189 072 filas. Sumó `fda-rl` (110 614) y `cdc-livd-sars-cov-2` (487). De LIVD, 4 filas son inválidas (sin `manufacturerName`; tres son filas de prueba `Test_*` de la planilla) y las 483 válidas no traen tipo de dispositivo, así que quedan sin decisión. Se lo avisé a `us`.
  - `eu` @`e1601ac2` (`origin/claude/adoring-curie-xdkt83`): 716 filas `eudamed-udi`, todas válidas, más 26 583 actores EUDAMED con SRN en `manifest.actors`.
  - `row`: pendiente. Avisó que va a empujar a `origin/claude/inspiring-planck-xhpf4w`.
- **Fuente nueva para la resolución**: los actores EUDAMED (SRN, nombre, país) entran al resolvedor como identidad publicada. No son equipos.
- **Nuevos tras deduplicar** (contra la pasada 2):
  - Fabricantes: +5 675 (18 978).
  - Modelos: +8 107 (81 440). Hay 429 modelos con registro en la UE y ninguno todavía en dos jurisdicciones a la vez: EUDAMED y la FDA no comparten UDI-DI en esta muestra, y las marcas o modelos no coinciden verbatim.
  - Registros: +108 692 (186 837).
  - EMDN: +1 código que no está en V2 (`W0105040619`, de EUDAMED, sin nombre publicado).
  - Tipos con al menos un modelo: 2 976 (+548).
  - Fusiones `same-registry-id`: 107 (SRN). A revisión: 233 `name-match-conflicting-ids`, porque el mismo nombre aparece con SRN distintos y no se fusiona.
  - Listados del sector: 148 empresas cruzan con un fabricante (+18).
- **Taxonomía** recargada: +1 concepto EMDN y una versión nueva del value set con 5 693 miembros. La 2.ª corrida da 0 (`docs/trabajo/2026-10-24-seed-dx-devices-master/evidencia/load-postgres16-pasada3.txt`).
- **Descartadas**: ninguna nueva.

### Pasada 4 (2026-10-24)

- **Regiones**: las tres consolidadas.
  - `us` @`3bea44dc`: 189 068 filas.
  - `eu` @`2e7f6e46` (`claude/adoring-curie-xdkt83`): 716 filas.
  - `row` @`4ab304c1` (`claude/inspiring-planck-xhpf4w`): **3 508 983 filas**, todas válidas:
    - `anvisa-produtos`: 93 770
    - `anvisa-produtos-modelos`: 1 027 762
    - `pmda-approvals`: 35 298
    - `hc-mdall`: 2 333 236
    - `tga-daen`: 18 917
  - `regions.mjs` prefiere ahora, por región, las ramas que avisaron las hermanas.
- **Cambio en el formato común**: una nomenclatura puede ir con código, con nombre o con los dos. Antes se exigía el código, y eso rechazaba 1 156 830 filas legítimas de ANVISA y PMDA (el «nome técnico» y el 一般的名称 se publican sin código). El README y el validador ya lo dicen.
- **Build en streaming**: tres pasadas sobre las filas, sin tenerlas en memoria. La primera valida y arma la taxonomía y las menciones de fabricantes. La segunda junta las filas de diagnóstico y las claves de sus modelos. La tercera suma las filas sin decisión que son del mismo modelo. Son unos 5 minutos para 3,7 millones de filas.
- **Criterios nuevos** (publicados, sin palabras clave):
  - Clase de riesgo de un esquema exclusivo de IVD: `eu-ivdr:*`, `eu-ivdd:*` y las clases «Class N - IVD» de la TGA. Así entran 424 filas de `tga-daen`.
  - Registro del mismo modelo: una fila sin tipo decidible entra si es del mismo fabricante resuelto con la misma marca (no vacía) y el mismo modelo, o con la misma UDI-DI, que una fila de diagnóstico. Queda como otro registro de ese modelo, con `typeEvidence: 'same-model'`. Así entran 254 registros (BR, CA, US de LIVD y EU).
- **Nuevos tras deduplicar** (contra la pasada 3):
  - Registros: +678 (187 515).
  - Fabricantes: +42 (19 020).
  - Modelos: 117 628. El salto de +36 188 **no son modelos nuevos**: es el cambio de agrupación. Antes, las filas sin marca ni modelo de un fabricante caían todas en un mismo «modelo»; ahora se separan por tipo de dispositivo.
  - **Modelos con registro en dos jurisdicciones: 239** (antes, 0).
  - Jurisdicciones con modelos: US 116 797, EU 434, AU 405, BR 226, CA 5.
  - Nodos: +2 785 «nome técnico» de ANVISA, +2 092 JMDN y +1 743 términos GMDN sin código (TGA). Todos quedan sin decisión.
  - Listados del sector: 191 empresas cruzan con un fabricante (+38).
- **Sin decisión: 3 510 405 filas.**
  - 2 334 508 no traen ningún tipo (MDALL de Health Canada no publica nomenclatura).
  - El resto trae nomenclaturas nacionales que no tienen un criterio publicado de «diagnóstico» que se pueda aplicar desde acá: el «nome técnico» de ANVISA y la JMDN sin su 類別. Quedan en `coverage.json` (`catalog.undeterminedTopTypes`) y no se fuerzan.
- **Taxonomía cargada**: +6 620 conceptos de las nomenclaturas nacionales. La 2.ª corrida da 0 (`evidencia/load-postgres16-pasada4.txt`).
- **Descartadas**: ninguna nueva.

### Pasada 5 (2026-10-24)

- **Regiones**:
  - `us`: 204 096 filas; sumó `fda-maude` (1 336) y `fda-recall` (13 692).
  - `eu`: sin cambios (716).
  - `row`: 3 534 775 filas; sumó `cdsco-import-licences` (India, 25 792). ROW dio la región por saturada y abrió su PR: mdavila-2001/mantra-core-health-api#693.
- **Criterios nuevos** (publicados, con cita en `lib/taxonomy.mjs`):
  - **Alcance de la fuente**: el LIVD de los CDC «maps all SARS-CoV-2 diagnostic tests that have received FDA Emergency Use Authorizations». Sus 483 kits entran como diagnóstico aunque no traigan product code (lo pidió `us`, que no quiso deducir uno).
  - **Tipo de licencia IVD**: en MDALL, la licencia «Test Kit» es un tipo de solicitud de IVDD según la guía de Health Canada «Application type for IVDDs». Entran 47 732 registros. No se pudo verificar que SOR/98-282 art. 1 defina «test kit»: el criterio cita la guía, no el reglamento.
  - **Descartado como criterio**: la clase de riesgo de CDSCO (`in:A`…`in:D`). India usa las mismas cuatro clases para dispositivos y para IVD, así que la clase no distingue.
- **Nuevos tras deduplicar** (contra la pasada 4):
  - Registros: **+62 636** (250 151).
  - Modelos: **+47 567** (165 195).
  - Fabricantes: **+921** (19 941).
  - Marcas: +8 357 (80 165).
  - Modelos en 2 jurisdicciones: 279 (+40). En 3 jurisdicciones: **7** (antes, 0).
  - Jurisdicciones: US 120 536, **CA 43 839**, EU 434, AU 405, BR 238, **IN 36**.
  - Nodos: +11 371 nombres de dispositivo de CDSCO, sin decisión.
- **Taxonomía cargada**: +11 371 conceptos y la 2.ª corrida da 0 (`evidencia/load-postgres16-pasada5.txt`).
- **Descartadas**: `syonin-history` (maestro de reembolsos del MHLW con códigos JAN). Lo descartó ROW: es una extracción de PDF hecha por un tercero, sin validar contra los PDF oficiales.

## Propuesta para el repo del modelo (`mantra-core-technologies/mantra-core-health-model`)

Un esquema nuevo `device_catalog` (módulo propio, después de 03 `terminology`
y antes de 23 `diagnostic_units`). Todas las tablas con `created_at`,
`updated_at`, `created_by_user_id`, `updated_by_user_id` y `row_version`
como el resto del modelo; ids `uuid` deterministas desde el importador.

| Tabla | Columnas | Claves e índices |
|---|---|---|
| `device_manufacturers` | `id`, `display_name varchar NOT NULL`, `normalized_key varchar NOT NULL`, `anchor_identifier varchar NOT NULL` (id publicado más fuerte o `name:<clave>:<país>`), `country_concept_id uuid NULL`, `state_concept_id uuid` | PK `id`; UNIQUE `anchor_identifier`; índice `normalized_key`; FK `country_concept_id`, `state_concept_id` → `terminology.catalog_concepts` |
| `device_manufacturer_names` | `id`, `manufacturer_id`, `name varchar NOT NULL`, `source_id uuid NOT NULL`, `row_count int` | FK → `device_manufacturers`, `terminology.terminology_sources`; UNIQUE (`manufacturer_id`, `name`, `source_id`) |
| `device_manufacturer_identifiers` | `id`, `manufacturer_id`, `scheme varchar NOT NULL` (srn, fei, fda-reg, lei, duns, cnpj, artg-sponsor…), `value varchar NOT NULL`, `source_id uuid NOT NULL` | UNIQUE (`scheme`, `value`); FK → `device_manufacturers`, `terminology.terminology_sources` |
| `device_manufacturer_merges` | `id`, `manufacturer_id`, `rule varchar NOT NULL`, `evidence jsonb NOT NULL`, `recorded_at timestamptz NOT NULL` | FK → `device_manufacturers`; índice `manufacturer_id` |
| `device_manufacturer_relationships` | `id`, `child_manufacturer_id`, `parent_manufacturer_id`, `relationship_type_concept_id`, `source_id`, `source_record_id varchar`, `source_url text` | FK ×2 → `device_manufacturers`; FK concepto y fuente; UNIQUE (`child_manufacturer_id`, `parent_manufacturer_id`, `relationship_type_concept_id`) |
| `device_brands` | `id`, `manufacturer_id`, `name varchar NOT NULL`, `normalized_key varchar NOT NULL` | FK → `device_manufacturers`; UNIQUE (`manufacturer_id`, `normalized_key`) |
| `device_models` | `id`, `manufacturer_id`, `brand_id uuid NULL`, `model varchar NULL`, `normalized_key varchar NOT NULL` | FK → `device_manufacturers`, `device_brands`; UNIQUE (`manufacturer_id`, `brand_id`, `normalized_key`) |
| `device_model_types` | `model_id`, `device_type_concept_id` | PK (`model_id`, `device_type_concept_id`); FK → `device_models`, `terminology.catalog_concepts` (los conceptos de `load-taxonomy.mjs`) |
| `device_identifiers` | `id`, `model_id`, `issuing_agency varchar NULL` (GS1, HIBCC, ICCBBA, IFA), `udi_di varchar NOT NULL` | FK → `device_models`; UNIQUE (`issuing_agency`, `udi_di`) |
| `device_registrations` | `id`, `model_id`, `jurisdiction_concept_id`, `source_id`, `source_record_id varchar NOT NULL`, `source_url text NOT NULL`, `source_version varchar NOT NULL`, `retrieved_at timestamptz NOT NULL`, `authorization_number varchar`, `authorization_date date`, `risk_class varchar`, `status varchar`, `manufacturer_name_verbatim varchar NOT NULL`, `brand_verbatim varchar`, `model_verbatim varchar` | FK → `device_models`, `terminology.terminology_sources`, `terminology.catalog_concepts`; UNIQUE (`source_id`, `source_record_id`); índices `model_id`, `authorization_number` |

Y en `diagnostic_units.diagnostic_equipment`: `device_model_id uuid NULL` FK →
`device_catalog.device_models` (sin tocar `manufacturer`/`model`, que siguen
sirviendo para texto libre cuando el equipo no está en el catálogo).

El importador del catálogo sale directo de `out/manufacturers.ndjson.gz` y
`out/models-*.ndjson.gz`: cada modelo ya trae sus registros con procedencia.

**Unión con la propuesta de `row`**
(`docs/trabajo/2026-10-24-seed-dx-devices-row/REPORTE.md`). Coinciden en
fabricantes con identificadores por esquema, modelos con tipo como FK a
`terminology.catalog_concepts`, autorizaciones con la cita completa por fila,
identificadores por modelo y la FK opcional `device_model_id` en
`diagnostic_equipment`. De `row` se suma:

- `device_identifiers.issuing_agency` admite también JAN y GTIN (no solo UDI-DI).
- `device_manufacturer_identifiers.scheme` incluye `jp-corporate-number`, `hc-company` y `cnpj`.
- Las nomenclaturas nacionales (`jmdn`, `br:anvisa-nome-tecnico`, `gmdn-pt`, `in:cdsco-device-name`) no piden tablas nuevas: `load-taxonomy.mjs` ya las carga como `code_systems` en `terminology`.
