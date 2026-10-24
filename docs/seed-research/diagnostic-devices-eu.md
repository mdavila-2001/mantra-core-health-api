# Equipos de diagnóstico y sus marcas — registros de Europa (EUDAMED, MHRA, Swissmedic)

Sesión `seed-dx-devices-eu` · rama `claude/adoring-curie-xdkt83` (desde `dev`) · código en
[`tools/terminology-import/diagnostic-devices/eu/`](../../tools/terminology-import/diagnostic-devices/eu/)
· formato común en [`tools/terminology-import/diagnostic-devices/README.md`](../../tools/terminology-import/diagnostic-devices/README.md)
· fuentes y términos en [`SOURCES.md`](../../tools/terminology-import/diagnostic-devices/eu/SOURCES.md).

## Resumen honesto

- **El corpus europeo no se pudo descargar desde esta sesión.** La política de red del entorno
  devuelve 403 en todos los hosts oficiales del reparto (EUDAMED, EMDN, MHRA, swissdamed,
  Ministero della Salute, NANDO, BfArM, AEMPS, ANSM) y también en los espejos generales
  (`zenodo.org`, `data.europa.eu`, `web.archive.org`). Solo responden GitHub, npm y PyPI.
- Se buscaron réplicas abiertas en esos hosts: no existe ninguna copia con licencia clara de
  EUDAMED, de la EMDN, de PARD ni de la BD/RDM. La única tabla real encontrada (4 203 fabricantes
  de swissdamed) proviene de extraer swissdamed y **se descartó** por los términos de Swissmedic.
- Resultado: **0 equipos, 0 fabricantes, 0 marcas, 0 conceptos EMDN** cargados. Nada se inventó.
  Esto es un **hueco bloqueado**, no una saturación.
- Lo que sí queda listo: pipeline completo (sondeo → descarga reanudable con manifiesto → NDJSON
  común comprimido y partido → carga de la EMDN a `terminology.*` sin DDL), contratos de las APIs
  verificados contra documentación citada, criterio de alcance EMDN, 21 tests dirigidos en verde y
  la propuesta de tablas para el repo del modelo.

**Para destrabarlo**: habilitar en *Network access* del entorno estos hosts y volver a correr
`probe.mjs → fetch.mjs → build.mjs` (o relanzar el /loop):
`api.datalake.sante.service.ec.europa.eu`, `health.ec.europa.eu`, `webgate.ec.europa.eu`,
`ec.europa.eu`, `www.dati.salute.gov.it`, `pard.mhra.gov.uk`, `swissdamed.ch`,
`www.bfarm.de`, `www.aemps.gob.es`, `ansm.sante.fr`. Además, para instalar dependencias:
`repo.yarnpkg.com` y `cdn.sheetjs.com` (ver «Entorno»).

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
| **Z** (equipamiento) | Revisión tipo por tipo | Contiene imagenología, monitorización, exploración funcional y patología digital, pero también equipos quirúrgicos y de terapia en los mismos grupos (verificado: `Z12130580` son accesorios de un sistema motorizado de cirugía ortopédica dentro de Z12). |
| **C, G, N, Q, R, U, V** | Revisión tipo por tipo | Mezclan ramas diagnósticas (electrodos ECG/EEG/EMG, endoscopía diagnóstica, oftalmología y audiometría, espirometría, urodinamia, termometría) con terapéuticas. |
| **A, B, D, F, H, J, K, L, M, P, S, T, X, Y** | Excluidas | Administración/infusión, transfusión, desinfección, diálisis, suturas, implantables activos, endoterapia/electrocirugía, instrumental quirúrgico, apósitos, prótesis, esterilización, protección/incontinencia, productos sin finalidad médica, ayudas técnicas. La recolección de muestras que es IVD ya está en W. |

Los tipos de las categorías en revisión entran **solo** si se listan uno por uno en
`INCLUDED_TYPE_PREFIXES` con su motivo y la versión de la EMDN donde se leyó el nombre oficial;
`build.mjs` escribe `out/emdn-scope-review.md` con todos esos tipos para decidirlos y falla si un
prefijo listado no existe. Hoy la lista está vacía porque la EMDN no se pudo descargar: decidirla
de memoria sería inventar.

Clases de riesgo: se conservan tal como las publica la fuente (EUDAMED decodifica
`RISK_CLASS_ID` con `/reference`); no se recalculan.

## Pipeline

```
node tools/terminology-import/diagnostic-devices/eu/probe.mjs    # qué hosts responden → out/probe/*.json
node tools/terminology-import/diagnostic-devices/eu/fetch.mjs    # crudos → ../diagnostic-devices-data/eu/cache (+manifest.json con sha256)
node tools/terminology-import/diagnostic-devices/eu/build.mjs    # → out/{emdn,devices-eu,manufacturers-eu}-NNN.ndjson.gz + coverage
node tools/terminology-import/diagnostic-devices/eu/load.mjs     # dry-run; --apply carga la EMDN a terminology.* (idempotente)
node --test "tools/terminology-import/diagnostic-devices/eu/test/*.test.mjs"
```

- **EUDAMED**: `GET /udi?NOMENCLATURE_CODE=<código>` por cada código EMDN en alcance, siguiendo
  `nextLink`; luego `GET /actors?ACTOR_ID=<SRN>` por cada fabricante visto. País del fabricante =
  prefijo del SRN (formato `XX-MF-000000000`), marcado en `extensions.manufacturerCountrySource`.
  Certificado y organismo notificado no están en el Data Lake; el adaptador del portal
  (`basicUdiData`) queda listo pero sin descarga en bloque hasta verificar términos.
- **EMDN**: el enlace al Excel se descubre en la página oficial; se valida que cada código tenga
  la forma oficial, que el nivel declarado coincida con la estructura y que la jerarquía cierre.
- **BD/RDM Italia**: el mapeo de columnas (`it-bdrdm.columns.json`) está en `verified: false`
  porque el encabezado real no se pudo ver; `build.mjs` imprime el encabezado y no normaliza nada
  hasta que se complete.
- **swissdamed**: adaptador listo y probado, **desactivado** por términos.
- **MHRA PARD, NANDO, BfArM, AEMPS, ANSM**: sin descarga masiva documentada; solo sondeo.

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
   (las cuatro regiones comparten el formato).

## Entorno (para quien retome)

- Red: además de las fuentes, están bloqueados `repo.yarnpkg.com` (Corepack baja Yarn 4 de ahí) y
  `cdn.sheetjs.com` (dependencia `xlsx` del `package.json`). Se instaló con
  `COREPACK_NPM_REGISTRY=https://registry.npmjs.org` y un ajuste **local y temporal** de `xlsx` a
  `0.18.5` del registro npm, revertido antes del commit (`package.json` y `yarn.lock` sin cambios).
- Crudos fuera de git en `../diagnostic-devices-data/eu/` (`DX_DEVICES_BUILD_DIR` lo redefine).
  Lo normalizado va comprimido a `out/` (partes < 50 MB), por orden del propietario.
