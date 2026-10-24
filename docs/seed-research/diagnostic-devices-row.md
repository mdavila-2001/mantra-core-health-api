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

## Pasada 2 — búsqueda de espejos por país (2026-10-24)

Búsquedas web (`site:github.com` y sin restricción) por registro: NMPA, MFDS,
TFDA, INVIMA, OMS PQ, ARTG, CDSCO, COFEPRIS, HSA, SFDA y ANMAT. Candidatos
clonados y revisados en `dx-devices-build/row/candidates/` (fuera de git).

| Fuente | Espejo | Filas nuevas | Fabricantes nuevos (exacto) | Marcas nuevas (exacto) |
|---|---|--:|--:|--:|
| `cdsco-import-licences` | vishnuu-patil/india-meddevice-intelligence `62e88588` (licencias hasta 2026-10-01) | 25 792 | 3 013 | 13 888 |
| **Total acumulado** | | **3 534 775** | **26 968** | **240 458** (pares fabricante+marca) |

Fabricantes y marcas nuevos = diferencia de los totales exactos entre la
pasada 1 y la 2 (los 3 367 fabricantes de CDSCO incluyen 354 que ya
figuraban, con el mismo texto, en otra fuente).

Candidatos descartados:

| Candidato | Motivo |
|---|---|
| masalu0105-gif/taiwan-laboratory-mcp, release `data-20261023` (TFDA, 104 891 licencias de data.gov.tw/9576) | Los assets de releases solo se bajan con el repo adjuntado con credenciales; esa acción fue denegada en esta sesión. Queda como hueco con la ubicación exacta. |
| xesxoo3417/medical-device-search `medical_devices_500.csv` | Es la clasificación de productos de MFDS (품목분류, 500 ítems), no registros de dispositivos. |
| hylussd/NMPA-Search | Herramienta de consulta por navegador; solo trae registros de muestra en el README. |
| Contextual-Intelligence/orsd | Agregador de alertas regulatorias; no trae registros de dispositivos. |
| thakorakash04-cell/meddevice-research-platform | El clon pide credenciales (repo privado o borrado). |
| anoukkim/emedi-crawler (MFDS) | Es un recolector con Selenium; no publica datos. |
| MightyAli98/pms-quality-control-room (SFDA) | Alertas de seguridad, no el registro nacional de dispositivos. |
| JediLin/Taiwan-*-permit-license-data-table-generator | Generadores que bajan el XML de TFDA en cada corrida; no traen los datos. |
| Apify, kmong y otros servicios pagos | No son archivos oficiales ni copias de uno. |

Sin espejo encontrado (siguen como hueco en `manifest.gaps`): NMPA, MFDS,
TFDA, INVIMA, COFEPRIS, ANMAT, ISP, DIGEMID, AGEMED, HSA, SFDA, AMAR, Thai FDA,
MDA, SAHPRA, OMS PQ, UNICEF, ARTG completo.

## Pasada 3 — más países y compras públicas (2026-10-24)

Búsquedas: Rusia (Росздравнадзор), China (UDI de NMPA), Filipinas (FDA CMDR),
Indonesia (AKL de Kemenkes), Turquía (TİTUBB/ÜTS), Vietnam (DMEC), Corea
(UDI de MFDS), Colombia (INVIMA en datos.gov.co), Global Fund, Health Canada
reciente y ANVISA reciente.

**Aporte: 0 filas nuevas** (total sin cambios: 3 534 775).

Candidatos revisados y descartados:

| Candidato | Motivo |
|---|---|
| robsonaamerico/projeto-de-compras-do-ministerio-da-saude `1465b402` (Banco de Preços em Saúde 2020–2026, CSV anuales crudos) | Compras públicas del Ministerio da Saúde (BR): de 76 681 compras de dispositivos solo 63 traen `registro_anvisa`, y no hay marca ni modelo (solo descripción CATMAT y fabricante). Sin registro ni modelo no hay equipo identificable con el criterio de deduplicación. Otros repos con el BPS (lf-vampre, waldineilameira-lab, ClaudiaRamos-Git, AnaysaLopes) traen versiones procesadas del mismo dato. |
| openpalliative/pal-devices-data | Trae la nomenclatura rusa НКМИ (tipos de dispositivo) y normas de dotación; no trae registros con fabricante. |
| Looffeeuu/SilverGuard (índice offline del UDI de NMPA) | El índice se arma en tiempo de ejecución; no hay datos en el repo. |
| 8023Ginger/medreg-hub, ahmedbins/fda_device | Herramientas de consulta, sin datos de registros fuera de EE. UU. |
| devladpopov/gosreestry-data, severin-d/opendata | Catálogos de registros rusos, no sus datos. |
| ihcstandardisasi/scrapKFA (Indonesia) | Descargador del catálogo KFA de SATUSEHAT; no publica los datos. |

Sin espejo nuevo: Rusia, Turquía, Vietnam, Filipinas, Indonesia, Global Fund.

## Pasada 4 — paquetes, Japón, Corea, China, OMS (2026-10-24)

Búsquedas: paquetes de PyPI/npm con registros embebidos, PMDA/JMDN en japonés,
품목허가 de MFDS, 国械注准 de NMPA, lista de diagnósticos precalificados de la OMS.

**Aporte: 0 filas nuevas** (total sin cambios: 3 534 775).

| Candidato | Motivo |
|---|---|
| peirin1230-ship-it/syonin-history `cc8289f` (notificaciones de 保険適用 del MHLW: 承認番号, 販売名, producto, JAN, titular) | Es una extracción de tablas desde PDF hecha por un tercero, no la copia de un archivo oficial: no cumple la regla de filas verbatim. Además son 特定保険医療材料 (materiales terapéuticos reembolsables: catéteres, implantes), y sus números de aprobación ya están en `pmda-approvals`. Queda anotado para `master/` como posible fuente de códigos JAN si se valida contra los PDF. |
| hopol/GD-MedProcure-Radar (compras de equipos médicos en Guangdong) | Solo trae anuncios de licitación (hospital, proyecto, fecha); sin marca, modelo ni registro. |
| q3dresearch/wss-who-prequal | Captura la lista de vacunas precalificadas, no la de diagnósticos in vitro. |
| PyPI / npm | No se encontró ningún paquete con registros de dispositivos de estas autoridades. |

## Saturación

Las pasadas 3 y 4 aportaron 0 filas seguidas: el loop se detiene. Con la red
de este entorno (solo GitHub, npm, PyPI y otros registros de paquetes), no
quedan copias públicas verificables de registros fuera de EE. UU. y Europa.
Los huecos están en `out/manifest.json` → `gaps`: dependen de la red hacia los
portales oficiales. Los normalizadores ya leen esos formatos (ANVISA, MDALL,
PMDA, CDSCO); para las demás autoridades no hay normalizador, porque no se
escribe sin el archivo real.

## Pasada 5 — red completa: ANVISA oficial (2026-10-24)

Con la red del entorno en Full, ANVISA se baja de `dados.anvisa.gov.br/dados/`
(`fetch-official.mjs`) y reemplaza a los dos espejos de la pasada 1.

| Fuente | Archivo oficial | Filas antes (espejo) | Filas ahora |
|---|---|--:|--:|
| `anvisa-produtos` | `TA_PRODUTO_SAUDE_SITE.csv` (`Last-Modified` 2026-10-13) | 93 770 | 100 681 |
| `anvisa-produtos-modelos` | `TA_PRODUTO_SAUDE_MODELO.csv` (`Last-Modified` 2025-12-29) | 1 027 762 | 3 274 089 |

Nuevo: marca de diagnóstico publicada por ANVISA (`extra.anvisaPetitions`), a
partir de las peticiones por número de proceso. 86 213 de 100 681 registros
cruzan; 18 968 tienen área de diagnóstico in vitro. Los asuntos primarios
separan MATERIAL (44 922), IVD (13 744) y EQUIPAMENTO (11 306).
