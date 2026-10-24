# Equipos de diagnóstico — registros del resto del mundo (fuera de EE. UU. y Europa)

Registro de pasadas del protocolo de saturación (`/loop`). Código y datos:
`tools/terminology-import/diagnostic-devices/row/` (fuentes y licencias en
`SOURCES.md`, cobertura en `COVERAGE.md`, salida en `out/`).

Deduplicación entre pasadas: por `source` + `sourceRecordId` (número de
registro o registro + modelo verbatim), nunca por parecido. Fabricantes y
marcas se cuentan por texto exacto; la unión entre fuentes la hace `master/`.

## Pasada 0 — discovery (2026-10-24)

### Dónde guardaría el modelo estos datos

- `diagnostic_units.diagnostic_equipment` (`src/modules/diagnostic_units/entities/diagnostic_equipment.entity.ts`)
  guarda **equipos instalados** en una sede: `equipment_type_concept_id` y
  `modality_concept_id` apuntan a `terminology.catalog_concepts`; `manufacturer`
  y `model` son texto libre por equipo.
- `terminology.*` (módulo 03) puede alojar los **tipos** de dispositivo como
  `catalog_concepts` de un `code_system` por nomenclatura (JMDN, nombre técnico
  ANVISA, GMDN), con atributos en `concept_properties`, como ya se hizo con `ndc`.
- **No existe** un catálogo de fabricantes, marcas, modelos ni registros
  sanitarios de dispositivos. No se crean tablas desde la API (ADR-0021). La
  propuesta para `mantra-core-technologies/mantra-core-health-model` la arma la
  sesión de consolidación (`justin/seed-dx-devices-master`), que une las cuatro regiones.

### Red

El proxy de salida de los entornos «alovida» y «Default» rechaza (`403` en
`CONNECT`) todos los portales oficiales; WebFetch también falla (`ENOTFOUND`).
Solo responden GitHub (api, raw, codeload), npm, PyPI, Maven Central,
conda-forge, RubyGems, `proxy.golang.org`, NuGet y Docker Hub. WebSearch
funciona para descubrir fuentes. Hosts probados y rechazados:

| País / ente | Host |
|---|---|
| Canadá · Health Canada MDALL | `health-products.canada.ca` |
| Australia · TGA ARTG | `www.tga.gov.au` |
| Brasil · ANVISA | `dados.anvisa.gov.br` |
| Colombia · INVIMA | `www.datos.gov.co` |
| China · NMPA UDI | `udi.nmpa.gov.cn` |
| Taiwán · TFDA | `data.gov.tw` |
| Israel · AMAR | `data.gov.il` |
| Singapur · HSA | `data.gov.sg` |
| Japón · PMDA | `www.pmda.go.jp` |
| Corea · MFDS | `www.data.go.kr` |
| India · CDSCO | `cdsco.gov.in` |
| OMS · Prequalification IVD | `extranet.who.int` |
| Bolivia · AGEMED | `www.agemed.gob.bo` |
| México | `datos.gob.mx` |
| Argentina | `datos.gob.ar` |
| Perú | `www.datosabiertos.gob.pe` |
| UNICEF Supply Catalogue | `supply.unicef.org` |
| Arabia Saudita · SFDA | `medicaldevice.sfda.gov.sa` |
| Tailandia · Thai FDA | `open.fda.moph.go.th` |
| Malasia · MDA | `portal.mda.gov.my` |

Vía adoptada: copias públicas en GitHub de archivos oficiales, fijadas por
commit y hash, con la cita del espejo en cada fila. Descartado: resúmenes de
WebFetch (pasan por un modelo y no garantizan filas literales) y escribir
parsers sin un archivo real contra el cual validarlos.

## Pasada 1 — espejos de ANVISA, PMDA, Health Canada y TGA (2026-10-24)

Espejos localizados por la sesión master y por esta, confirmados con `git clone`:

| Fuente | Espejo | Filas nuevas | Fabricantes nuevos (exacto) | Marcas nuevas (exacto) |
|---|---|--:|--:|--:|
| `anvisa-produtos` | victoracioly/g.stec `8a4c6ca3` (corte 2025-06-17) | 93 770 | 12 076 | 87 367 |
| `anvisa-produtos-modelos` | adnanioricce/DHsys `81800583` (corte 2020-12-25) | 1 027 762 | 10 098 | 68 980 |
| `pmda-approvals` | zoefcuk/pmda-medical-devices `d829883b` | 35 298 | 2 716 | 31 127 |
| `hc-mdall` | misterrPink1/symmetric `a43a1a58` (corte 2020-02-07) | 2 333 236 | 6 236 | 57 356 |
| `tga-daen` | tobinsouth/MedicalDeviceNLP `868d2e2a` | 18 917 | 1 674 | 16 091 |
| **Total pasada 1** | | **3 508 983** | **23 955** (todas las fuentes) | **226 570** (pares fabricante+marca) |

Descartes dentro de la pasada (contados en `out/manifest.json` → `stats`):
PMDA, 815 trámites repetidos en dos listados (quedan en `extra.alsoListedIn`)
y 3 sin titular; Health Canada, 1 identificador repetido; TGA, 1 dispositivo
sin fabricante.

Fuentes descartadas en esta pasada:

| Fuente | Motivo |
|---|---|
| `misterrPink1/symmetric/AccessGUDID.zip` | Es GUDID de la FDA: corresponde a la región `us/`. |
| Apify (actores de ANVISA y Health Canada) | Servicio pago de terceros, no es un archivo oficial ni una copia de uno. |
