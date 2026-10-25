# Equipos de diagnóstico y sus marcas — registros de Europa (EUDAMED, MHRA, Swissmedic)

Sesión `seed-dx-devices-eu` · rama `claude/adoring-curie-xdkt83` (desde `dev`) · código en
[`tools/terminology-import/diagnostic-devices/eu/`](../../tools/terminology-import/diagnostic-devices/eu/)
· formato común: `tools/terminology-import/diagnostic-devices/README.md`, escrito por la sesión
`master` (rama `justin/seed-dx-devices-master`); esta rama lo respeta y no lo modifica
· fuentes y términos en [`SOURCES.md`](../../tools/terminology-import/diagnostic-devices/eu/SOURCES.md).

## Resumen honesto

- **Pasada 7 (2026-10-24, red abierta): el corpus sale de las fuentes oficiales.**
  - **EUDAMED (Data Lake oficial de DG SANTE)**: `GET /udi` por cada uno de los **3 142 códigos
    EMDN en alcance**, paginado hasta el final (`_complete.json` en los 3 142, 0 huecos):
    306 474 UDI-DI leídos → **303 085 equipos de diagnóstico** exportados, cada uno con su ficha
    pública `udiDiData/{uuid}` como `sourceUrl`.
  - **BD/RDM del Ministero della Salute (Italia)**: ZIP oficial del 2026-10-19, 2 435 599
    dispositivos leídos → 216 848 en alcance → **200 563** exportados tras deduplicar.
  - **EMDN v2026 oficial** (Excel de la Comisión): 8 516 conceptos, 3 142 en alcance.
  - **32 753 actores fabricantes** del Data Lake (solo datos de la organización).
- Total: **503 648 equipos** de **11 414 fabricantes** y **267 471 marcas** (fabricante + marca),
  0 filas rechazadas, 20 547 duplicados descartados (exactos: misma fila, mismo UDI-DI o mismo
  fabricante + modelo + marca cuando no hay UDI-DI). Las réplicas de git de las pasadas 4–6
  quedan como respaldo: solo 14 de sus filas en alcance no estaban ya en el Data Lake y se
  conservan con su procedencia de réplica.
- **Huecos que no se pueden llenar sin autorización o sin descarga pública**: swissdamed (las
  condiciones de Swissmedic prohíben la extracción automatizada), MHRA PARD (sin licencia abierta),
  certificados del portal de EUDAMED (API interna sin términos), NANDO, BfArM, AEMPS y ANSM (sin
  descarga masiva). Los certificados que hay salen de la réplica `eudamed2firstbase` por UUID.
- **Saturación**: con las fuentes oficiales alcanzables y con licencia, el Data Lake se recorrió
  entero para cada código en alcance y la BD/RDM es un volcado completo. La pasada 8 (volver a
  pedir y reconstruir) aportó 0 filas nuevas y dio una salida idéntica byte a byte.

## Paso 0 — discovery del modelo

| Qué | Dónde | Hallazgo |
|---|---|---|
| Equipo instalado en una unidad | `src/modules/diagnostic_units/entities/diagnostic_equipment.entity.ts` | Tabla `diagnostic_units.diagnostic_equipment`: instancia física por sede (`equipment_type_concept_id` → `terminology.catalog_concepts`, `manufacturer` y `model` como `varchar` libres, `serial_number`, calibración, estado). **No es un catálogo** de fabricantes/marcas/modelos. |
| Terminología | `src/modules/terminology/entities/*` | `terminology_sources`, `code_systems`, `code_system_versions`, `catalog_concepts`, `concept_properties`, `concept_designations`, `concept_relationships`, `catalog_import_batches`. Sirve para la **EMDN** como sistema de clasificación. |
| Precedente de productos como conceptos | `tools/terminology-import/import-ndc.mjs` | NDC cargado como `catalog_concepts` con `concept_properties` (`manufacturer`, …). Posible para equipos, pero mezcla catálogo comercial con terminología y no tiene claves para UDI-DI, certificado ni fabricante con SRN. |
| `grep -rliE "gmdn\|emdn\|udi_di"` en `src/` | — | Ninguna columna para EMDN, GMDN, UDI-DI, SRN ni certificado. |

Conclusión: la EMDN se carga a `terminology.*` (sistema `emdn`). El catálogo de equipos
(fabricante + marca + modelo + UDI-DI) **no tiene dónde guardarse** y no se inventan tablas: ver
la propuesta al final.

## Alcance «diagnóstico» según la EMDN

Regla: se decide por **código**, nunca por palabras del nombre (implementado en
[`lib/emdn-scope.mjs`](../../tools/terminology-import/diagnostic-devices/eu/lib/emdn-scope.mjs)).
Las descripciones de categoría son paráfrasis propias para justificar; el nombre oficial sale de
la EMDN descargada.

| Categoría | Decisión | Motivo |
|---|---|---|
| **W** (IVD) | **Incluida entera** | Todo producto IVD es diagnóstico (IVDR art. 2.2): analizadores, reactivos, kits, calibradores, controles, autodiagnóstico y point-of-care. |
| **Z** (equipamiento) | **Tipo por tipo** | Entran: medicina nuclear (Z1102), radiología diagnóstica (Z1103), ecografía (Z1104), RM (Z1105), gestión de imagen y PACS (Z1106, Z1107), densitometría, monitores diagnósticos, termografía; endoscopía diagnóstica GI, GU, pulmonar, ORL y cápsula (Z120204–Z120212 salvo robótica, motorizada, litotricia, neuro y artroscopía); monitorización y telemetría de signos vitales; diagnóstico de medicina general (dermatoscopios, glucómetros, capilaroscopios…); ECG, Holter, ergometría, gasto cardíaco; EEG, EMG, PSG, MEG; oftalmología diagnóstica; audiometría y vestibular; espirometría (Z1215); urodinamia y uroflujometría; diagnóstico prenatal; manometría y pH GI; poligrafía y Holter multidisciplinario; consumibles diagnósticos (Z13). Quedan fuera radioterapia (Z1101), dosimetría, cirugía, terapia y los «accesorios/software/otros» de grupos mixtos. |
| **C** | Tipo por tipo | Entran: angiografía **diagnóstica** cardíaca y periférica, FFR, electrofisiología y mapeo, electrodos de ECG, sensores de oximetría, estetoscopios, esfigmomanómetros. Fuera: angioplastia, embolización, cánulas, guías, introductores. |
| **G** | Tipo por tipo | Entran: sondas diagnósticas oroesofágicas, procedimientos diagnósticos GI (G0206) y endoscopía GI diagnóstica (G0307). |
| **N** | Tipo por tipo | Entran: electrodos de EMG y EEG. Fuera: electroestimuladores, drenajes, catéteres. |
| **Q** | Tipo por tipo | Entran: electrodos oftalmológicos de diagnóstico. Fuera: odontología, cirugía oftálmica y ORL. |
| **R** | Tipo por tipo | Entran: sondas de broncoscopía de un solo uso y dispositivos de prueba de función pulmonar. |
| **U** | Tipo por tipo | Entran: urodinamia (U05), estudio fetal, amnioscopios. |
| **V** | Tipo por tipo | Entran: dispositivos de medición (V03: termómetros, sondas de temperatura, calibres, goniómetros, tallímetros, balanzas). |
| **A, B, D, F, H, J, K, L, M, P, S, T, X, Y** | Excluidas | Administración/infusión, transfusión, desinfección, diálisis, suturas, implantables activos, endoterapia/electrocirugía, instrumental quirúrgico, apósitos, prótesis, esterilización, protección/incontinencia, productos sin finalidad médica, ayudas técnicas. La recolección de muestras que es IVD ya está en W. |

La lista exacta, con el motivo de cada uno de los 80 prefijos, está en `INCLUDED_TYPE_PREFIXES`
(`lib/emdn-scope.mjs`), decidida leyendo el nombre oficial de cada tipo en la EMDN v2026 (en la
pasada 7 se quitó `Z120306`, que no existe en la v2026 y queda cubierto por `Z120302`, y se
agregaron `C01040401` y `C040401`, angiografía y guías neurovasculares diagnósticas). El árbol
completo con ✔/✘ por tipo queda en `out/emdn-scope-review.md`.

Clases de riesgo: se conservan tal como las publica la fuente (EUDAMED decodifica
`RISK_CLASS_ID` con `/reference`); no se recalculan.

## Pipeline

```
node tools/terminology-import/diagnostic-devices/eu/probe.mjs    # qué hosts responden → out/probe/*.json
node tools/terminology-import/diagnostic-devices/eu/fetch.mjs    # crudos → ../diagnostic-devices-data/eu/cache (+manifest.json con sha256)
node tools/terminology-import/diagnostic-devices/eu/build.mjs    # → out/manifest.json + out/<source>-NNNN.ndjson.gz + out/emdn/ + coverage
node tools/terminology-import/diagnostic-devices/eu/load.mjs     # dry-run; --apply carga la EMDN a terminology.* (idempotente)
node --test "tools/terminology-import/diagnostic-devices/eu/test/*.test.mjs"
```

- **Formato de salida** (el de `master`): `out/manifest.json` con región, archivos (filas, sha256)
  y huecos; una parte `<source>-0001.ndjson.gz` por fuente (`eudamed-udi`, `it-salute-bdrdm`, …);
  `manufacturerRegistryId` con prefijo `srn:`; clase con esquema (`eu-mdr:IIa`, `eu-ivdr:C`) solo
  si legislación y etiqueta decodificadas encajan exactamente, si no `eudamed:<etiqueta>`; lo
  propio de la fuente en `extra`. La EMDN va aparte en `out/emdn/` (clasificación, no filas).
- **Recorte**: solo se exportan las filas cuyo código EMDN/CND cae en W o en uno de los 80 tipos
  incluidos (`extra.dxScope` dice la regla); el resto ni se pide a EUDAMED.
- **EUDAMED**: `GET /udi?NOMENCLATURE_CODE=%20<código>` (el Data Lake guarda el código con un
  espacio inicial; sin él devuelve 0 filas) por cada código en alcance, 10 en paralelo, siguiendo
  `nextLink` (`$after=…`), con reintentos ante 429/5xx y páginas gzip reanudables. Luego
  `GET /actors?ACTOR_TYPE=Manufacturer`. País del fabricante = `ACT_COUNTRY_ISO2_CODE` del actor;
  si falta, prefijo del SRN, marcado en `extra.manufacturerCountrySource`. Certificado y organismo
  notificado no están en el Data Lake: se copian de la réplica `eudamed2firstbase` por UUID
  (`extra.certificatesSource`).
- **EMDN**: el enlace al Excel se descubre en la página oficial; se valida que cada código tenga
  la forma oficial, que el nivel declarado coincida con la estructura y que la jerarquía cierre.
- **BD/RDM Italia**: columnas verificadas contra el CSV real y el diccionario v2.0
  (`it-bdrdm.columns.json`, `verified: true`); lectura en streaming (525 MB). Modelo =
  `cod_catalogo_fabbr_ass`, marca = `denominazione_commerciale`, tipo = `classificazione_cnd`
  (sistema `cnd`), id del fabricante `it-cf:` (solo código fiscal de empresa, 11 dígitos) o
  `vat:`. Sin UDI-DI, clase ni país en la fuente: van en null.
- **Datos personales**: de los actores solo se publican datos de la organización (nunca PRRC,
  correo ni teléfono); un correo dentro de un campo descriptivo deja el campo en null
  (`extra.redactedFields`, 32 filas); el código fiscal de persona física no se publica.
- **swissdamed**: adaptador listo y probado, **desactivado** por términos.
- **MHRA PARD, NANDO, BfArM, AEMPS, ANSM**: sin descarga masiva documentada o sin licencia; solo sondeo.

## Protocolo de saturación — bitácora de pasadas

Regla: se cierra cuando dos pasadas seguidas aportan 0 filas nuevas **con las fuentes
alcanzables**. Si las fuentes siguen bloqueadas, el cierre es **BLOQUEADO**, nunca «saturado».
Deduplicación: UDI-DI, certificado + modelo, o fabricante + modelo normalizados (nunca difusa).

### Pasada 0 — 2026-10-24 · descubrimiento

- Fuentes consultadas: EUDAMED Data Lake, EUDAMED portal, EMDN, MHRA PARD, swissdamed, BD/RDM y
  CND (Italia), NANDO, BfArM, AEMPS, ANSM (todas: 403 de la política de red).
  Espejos: `zenodo.org`, `data.europa.eu`, `huggingface.co`, `kaggle.com`, `web.archive.org`
  (403). Registro npm (búsqueda `emdn`, `eudamed`, `gmdn`, `udi-di`, `medical device
  nomenclature`) e índice completo de PyPI (921 687 proyectos filtrados por
  `emdn|eudamed|gmdn|udi-di|medical-device|mhra|swissmedic|nomenclat|gudid|medtech`): ningún
  paquete con datos. GitHub (búsqueda web): `openregulatory/eudamed-api`,
  `openregulatory/eudamed-audit`, `Arya012-UvA/Eudamed_Lookup`, `Delapro/EUDAMED`,
  `t4dhg/mcp-eudamed`, `zdavatz/swissdamed2sqlite`, `register-dynamics/notified-body-registers`.
- Nuevos tras deduplicar: **0 equipos · 0 fabricantes · 0 marcas**.
- Aprovechado (contratos, no datos): OpenAPI oficial del Data Lake, sobre de respuesta y nombres
  de campo (mcp-eudamed), API del portal y certificados (openregulatory), API de swissdamed
  (swissdamed2sqlite).
- Descartadas: `swissdamed2sqlite/csv/srn_unique.csv` (4 203 fabricantes reales, pero extraídos
  de swissdamed contra las condiciones de Swissmedic); `golden_set.tsv` (sin UDI-DI ni id, no
  trazable); actores de Apify (raspadores pagos, no fuente primaria); copias de la EMDN en Scribd
  (no oficiales); `notified-body-registers` (NANDO de 2018, previo a MDR/IVDR); CodeSystem CND
  del CNR (un solo código).

### Pasada 1 — 2026-10-24 · primera corrida del pipeline

- `probe.mjs`: 0/11 fuentes alcanzables, 11 bloqueadas
  (`out/probe/probe-20261024T0311.json`).
- `fetch.mjs`: 0 archivos, 11 huecos registrados en el manifiesto.
- `build.mjs`: 0 equipos en alcance, 0 fabricantes, 0 conceptos EMDN; `out/coverage.md` lista
  los huecos.
- Nuevos tras deduplicar: **0 · 0 · 0**.

### Pasada 2 — 2026-10-24 · formato común de `master` y nuevo sondeo

- Cambio: la sesión `master` publicó el formato común (`diagnostic-devices/README.md`); la salida
  se adaptó a él (manifest, nombres de fuente, `srn:`, `extra`, clase con esquema) y se retiró el
  README propio para no pisarlo. Las categorías en revisión ahora se exportan marcadas.
- `probe.mjs`: 0/11 alcanzables (`out/probe/probe-20261024T0330.json`).
- `fetch.mjs`: 0 archivos, 11 huecos. `build.mjs`: 0 filas; `out/manifest.json` con 11 huecos.
- Fuentes nuevas buscadas: ninguna adicional alcanzable (los hosts siguen bloqueados).
- Nuevos tras deduplicar: **0 · 0 · 0**. Segunda pasada seguida en 0 **por bloqueo**: el loop se
  cierra como **BLOQUEADO**, no como saturado.

### Pasada 3 — 2026-10-24 · /loop (primer cierre)

- `probe.mjs`: 0/11 alcanzables (`out/probe/probe-20261024T0335.json`). Sin cambios en la
  política de red: no se descargó nada.
- Nuevos tras deduplicar: **0 · 0 · 0**. Loop detenido: **BLOQUEADO**. Para reanudar, habilitar
  los hosts listados arriba y relanzar el /loop (o `probe → fetch → build`).

### Pasada 4 — 2026-10-24 · réplicas públicas en GitHub (aviso de `master`)

- La sesión `master` encontró copias en git de datos de esta región. Se verificó cada una
  (licencia, formato, y en el código del convertidor qué campo de EUDAMED alimenta cada valor)
  y se fijó por commit en `lib/mirrors.mjs`; `fetch-mirrors.mjs` las clona con checkout
  disperso y anota el sha256.
- Fuentes nuevas:
  - `zdavatz/eudamed2firstbase@48f93836`: 22 865 UDI-DI de EUDAMED en GS1 firstbase. Mapeo
    verificado en `src/transform_detail.rs`: EMDN = clasificación 88, clase = 76/85, modelo =
    `MODEL_NUMBER` (deviceModel) o la referencia, **descartando** la referencia cuando el
    convertidor la rellenó con el GTIN; la clase I se marca como posible valor por defecto del
    convertidor.
  - `DLinRT-eu/dlinrteu-website@f096a477`: 116 dispositivos de una consulta al portal por código
    EMDN (42 de ecografía Z1104 en alcance; 74 de radioterapia Z1101 fuera).
  - `BatirMedical/nomenclature-emdn@e0131762`: EMDN V2 completa (8 453 términos). Permitió decidir
    el alcance **tipo por tipo** fuera de W (79 prefijos con motivo).
  - `longtran00/EUDAMED_ManufacturersScraper@44ff9f90`: 43 669 filas de actores fabricantes
    (todas las versiones) → 26 583 SRN con su versión vigente; 571 inactivos.
- Leídas 22 981 filas de equipos → **716 en alcance tras deduplicar** (157 duplicados por UDI-DI
  o fabricante + modelo + marca; 22 108 fuera de alcance por regla, contadas en
  `out/coverage.json`). **Nuevos: 716 equipos · 114 fabricantes · 391 marcas**, más 8 453
  conceptos EMDN y 26 583 actores.
- Descartadas: `zdavatz/swissdamed2sqlite/csv/srn_unique.csv` (sigue en pie el motivo de términos
  de Swissmedic); los mapeos GMDN↔EMDN de `lisadonlon/GMDNEMDN`, `Kilanopi` y `cl-tud` (son
  automáticos por similitud de texto, no oficiales; aviso de `master`).

### Pasada 5 — 2026-10-24 · búsqueda de más réplicas

- Fuentes buscadas (buscador web): copias en git de EUDAMED (`udiDiData`, Basic UDI-DI,
  certificados), de la BD/RDM y la CND italianas, de MHRA PARD, y repos de `zdavatz`.
- Resultado: solo los repos ya usados o descartados, servicios pagos de Apify y catálogos que
  enlazan a la fuente oficial (`italia/awesome-italian-public-datasets`). **Nuevos: 0 · 0 · 0**.

### Pasada 6 — 2026-10-24 · búsqueda de más réplicas (cierre)

- Fuentes buscadas: catálogos CSV con código EMDN y UDI-DI; volcados completos del listado de
  EUDAMED; la EMDN en castellano y el CodeSystem EMDN de la ANS francesa
  (`interop.esante.gouv.fr`, CC BY 4.0: 403 en el proxy y el recurso publicado no trae los
  códigos).
- Resultado: nada nuevo (`bruhngl0/eudamed-explorer` es un explorador, sin datos). **Nuevos:
  0 · 0 · 0**.
- Dos pasadas seguidas en 0 con todo lo alcanzable agotado: **loop detenido**. No es saturación
  de EUDAMED: el resto exige los hosts oficiales.

### Pasada 7 — 2026-10-24 · fuentes oficiales con la red abierta

- Fuentes: EMDN oficial, EUDAMED Data Lake (`/reference`, `/udi` × 3 142 códigos, `/actors`),
  BD/RDM y CND de dati.salute.gov.it. Términos leídos en vivo: EMDN (CC BY 4.0 de la Comisión),
  IODL 2.0, Swissmedic (prohíbe la extracción automatizada) y PARD (solo Crown Copyright).
- Resultado: **+303 085 equipos de EUDAMED y +200 563 de la BD/RDM**; 0 huecos de descarga.
  Evidencia en `docs/trabajo/2026-10-24-seed-dx-devices-eu-oficial/evidencia/`.
- Arreglos que salieron al usar datos reales: espacio inicial en `NOMENCLATURE_CODE`; `$after`
  que cambia en cada página; encabezado del Excel v2026; la deduplicación colapsaba UDI-DI
  distintos con el mismo modelo (ahora el UDI-DI manda); 21 páginas sin metadatos de corridas
  cortadas (se volvieron a pedir en vez de rellenar la fecha).

### Pasada 8 — 2026-10-24 · repetición (cierre)

- Se volvió a correr `fetch.mjs` (reanuda: solo pide lo que falta) y dos veces `build.mjs`.
- Resultado: **Nuevos: 0**; la salida es idéntica byte a byte entre corridas (sha256 en la
  evidencia). Dos pasadas seguidas sin filas nuevas con todo lo oficial y licenciado agotado:
  **loop detenido**. Lo que falta exige autorización (Swissmedic, MHRA) o fuentes sin descarga.

## Propuesta para el repo del modelo (`mantra-core-technologies/mantra-core-health-model`)

El modelo no tiene catálogo de equipos. Propuesta concreta (a decidir y escribir en el repo del
modelo; la API no escribe DDL, ADR-0021):

1. Esquema `device_catalog` (o dentro de `diagnostic_units` si se prefiere no abrir uno nuevo):
   - `device_manufacturers`: `id`, `registry_system` (`EUDAMED_SRN`, `SWISSDAMED_CHRN`, `FDA_FEI`,
     …), `registry_id`, `name`, `country_code` (ISO alfa-2), `actor_role`, `source`,
     `source_record_id`, `source_url`, `source_version`, `retrieved_at`; único
     (`registry_system`, `registry_id`).
   - `device_models`: `id`, `manufacturer_id` → `device_manufacturers`, `brand_name`, `model`,
     `udi_di`, `basic_udi_di`, `device_type_concept_id` → `terminology.catalog_concepts` (EMDN o
     GMDN), `risk_class`, `status`, `source`, `source_record_id`, `source_url`, `source_version`,
     `retrieved_at`; único (`source`, `source_record_id`) e índice por `udi_di`.
   - `device_certificates`: `id`, `device_model_id`, `certificate_number`, `revision`,
     `certificate_type`, `notified_body_number`, `notified_body_name`, `issue_date`,
     `expiry_date`, `status`, procedencia; único (`certificate_number`, `revision`,
     `device_model_id`).
2. `diagnostic_units.diagnostic_equipment.device_model_id` (nullable) → `device_models`, para que
   el equipo instalado apunte al modelo del catálogo en vez de repetir `manufacturer`/`model` como
   texto libre (que se conservan por compatibilidad).
3. Con eso, `load.mjs` agrega la carga de `devices-*.ndjson.gz` y `manufacturers-*.ndjson.gz`
   (las cuatro regiones comparten el formato; `master` ya consolida modelos y fabricantes).

## Entorno (para quien retome)

- Red: desde el 2026-10-24 16:29 UTC el entorno tiene red completa. Antes estaban bloqueados los
  hosts oficiales, `repo.yarnpkg.com` y `cdn.sheetjs.com`; se instaló con
  `COREPACK_NPM_REGISTRY=https://registry.npmjs.org` y un ajuste **local y temporal** de `xlsx` a
  `0.18.5` del registro npm, revertido (`package.json` y `yarn.lock` sin cambios).
- Crudos fuera de git en `../diagnostic-devices-data/eu/` (`DX_DEVICES_BUILD_DIR` lo redefine):
  ~3 300 páginas gzip del Data Lake, el CSV de la BD/RDM (525 MB) y el Excel de la EMDN. Lo
  normalizado va comprimido a `out/` (partes < 45 MB), por orden del propietario.
- `build.mjs` necesita `node --max-old-space-size=12288` con el corpus completo (~90 s).
