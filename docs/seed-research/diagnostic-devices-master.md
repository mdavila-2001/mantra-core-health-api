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
`out/models.ndjson.gz` (cada modelo ya trae sus registros con procedencia).
