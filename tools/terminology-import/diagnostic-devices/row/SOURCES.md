# Fuentes · equipos de diagnóstico · resto del mundo (ROW)

Región `row/` del catálogo común (`../README.md`). Todo lo que hay en `out/`
sale de las fuentes de esta tabla; lo que se buscó y no se pudo obtener está
en `out/manifest.json` → `gaps` y en `docs/seed-research/diagnostic-devices-row.md`.

## Cómo se obtuvieron

El proxy de salida de los entornos en la nube rechaza (`403` en `CONNECT`)
todos los portales oficiales. Cada fuente se leyó de una **copia pública en
GitHub del archivo oficial**, fijada a un commit y a un hash de contenido en
`sources.mjs`. Por fila:

- `sourceUrl`: la URL oficial cuando el espejo la publica por fila (PMDA: el
  Excel del que sale cada trámite); si no, la URL del archivo en el espejo,
  fijada al commit.
- `sourceVersion`: la fecha de corte **del dato** (columna de actualización de
  la fuente o último registro), más el espejo y su commit.
- `retrievedAt`: cuándo se clonó el espejo.
- `extra.mirror`: repo, commit, ruta y hash del archivo leído.
- `extra.officialPortal`: el portal oficial de la fuente.

Un espejo es una copia hecha por un tercero: no se pudo comparar contra el
original. Los encabezados coinciden con los de la fuente oficial que cita cada
espejo, los conteos son coherentes y ningún valor se tocó; aun así, cuando la
red lo permita, conviene reemplazar cada espejo por la descarga oficial (los
normalizadores leen el mismo formato).

## Fuentes

| `source`                  | Autoridad (país)   | Archivo oficial                                                                 | Espejo (commit)                                                                                                                                                                | Corte del dato                                                |     Filas |
| ------------------------- | ------------------ | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- | --------: |
| `anvisa-produtos`         | ANVISA (BR)        | `TA_PRODUTO_SAUDE_SITE.csv`, datos abiertos                                     | — (descarga oficial, `fetch-official.mjs`)                                                                                                                                     | `Last-Modified` 2026-10-13 (`DT_ATUALIZACAO_DADO` 2026-10-12) |   100 681 |
| `anvisa-produtos-modelos` | ANVISA (BR)        | `TA_PRODUTO_SAUDE_MODELO.csv`, datos abiertos                                   | — (descarga oficial)                                                                                                                                                           | `Last-Modified` 2025-12-29                                    | 3 274 089 |
| `pmda-approvals`          | PMDA (JP)          | 医療機器の承認品目一覧 y 認証品目リスト (Excel por año fiscal)                  | [zoefcuk/pmda-medical-devices](https://github.com/zoefcuk/pmda-medical-devices) `d829883b` · `index.html`, JSON embebido (sha256 `3e14d600…`)                                  | trámites hasta 2026                                           |    35 298 |
| `hc-mdall`                | Health Canada (CA) | MDALL, API pública (licencias, compañías, identificadores)                      | [misterrPink1/symmetric](https://github.com/misterrPink1/symmetric) `a43a1a58` · `datasets.zip` (sha256 `e2a3f451…`)                                                           | 2020-02-07 (`last_refresh_dt`)                                | 2 333 236 |
| `tga-daen`                | TGA (AU)           | DAEN, notificaciones de eventos adversos de dispositivos                        | [tobinsouth/MedicalDeviceNLP](https://github.com/tobinsouth/MedicalDeviceNLP) `868d2e2a` · `data/medical_device_summaries/*.csv` + `data/list_of_reports/*.pickle`             | reportes hasta 2021                                           |    18 917 |
| `cdsco-import-licences`   | CDSCO (IN)         | «MD - Medical Devices», licencias de importación IMP/MD de la autoridad central | [vishnuu-patil/india-meddevice-intelligence](https://github.com/vishnuu-patil/india-meddevice-intelligence) `62e88588` · `Data/MD - Medical Devices.xlsx` (sha256 `df214403…`) | licencias hasta 2026-10-01                                    |    25 792 |
| `tfda-devices`            | TFDA (TW)          | 醫療器材許可證資料集, data.gov.tw 9576 (export 68)                              | — (descarga oficial)                                                                                                                                                           | `modifiedDate` 2026-10-15                                     |    93 430 |
| `tfda-tudid`              | TFDA (TW)          | 醫療器材單一識別碼 (TUDID), data.gov.tw 151955 (export 197)                     | — (descarga oficial)                                                                                                                                                           | `modifiedDate` 2026-10-12                                     |   688 258 |

Conteos exactos y por archivo: `out/manifest.json`. Cobertura: `COVERAGE.md`.

## Licencias y términos de uso

| Fuente              | Datos (autoridad)                                                                                                                                                                                                   | Espejo                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| ANVISA              | Datos abiertos del Poder Ejecutivo federal de Brasil (Decreto nº 8.777/2016). La licencia exacta del conjunto no se pudo leer desde la nube: **por verificar** en la ficha del conjunto.                            | g.stec: sin licencia publicada. DHsys: MIT (cubre el código del repo; los CSV son datos de ANVISA).      |
| PMDA                | Listados públicos de PMDA. Los términos de reutilización del sitio de PMDA no se pudieron leer desde la nube: **por verificar**.                                                                                    | Sin licencia publicada; el propio espejo se declara «参考用» (de referencia) y remite al Excel oficial.  |
| Health Canada       | MDALL figura en el Portal de Gobierno Abierto de Canadá (Open Government Licence – Canada según el portal; **por verificar** la ficha).                                                                             | Sin licencia publicada.                                                                                  |
| TGA                 | Contenido de la TGA, con el aviso de DAEN de que una notificación no prueba que el dispositivo causó el evento. Términos de reutilización **por verificar**.                                                        | Sin licencia publicada.                                                                                  |
| CDSCO               | Lista pública de CDSCO. Términos de reutilización **por verificar**.                                                                                                                                                | El repo declara que los archivos de datos conservan la licencia de su fuente original; el código es MIT. |
| TFDA                | 政府資料開放授權條款 — 第1版 (Open Government Data License, Taiwán; `license: 1` en la ficha de data.gov.tw), compatible con CC BY 4.0: exige citar al proveedor (衛生福利部食品藥物管理署).                        | —                                                                                                        |
| PMDA (maestro JMDN) | Contenido del sitio de PMDA (医療機器基準データベース). Los términos de reutilización del sitio no se pudieron confirmar: **por verificar**. Solo se usan nombre, código, clase y clasificación de cada 一般的名称. | —                                                                                                        |

Ninguna fuente se usó para algo distinto de catalogar dispositivos. No se
eludieron CAPTCHAs ni `robots.txt`: lo bloqueado quedó como hueco.

## Qué se toma de cada fuente

### `anvisa-produtos` y `anvisa-produtos-modelos` (Brasil)

- Desde la pasada 5 salen de los archivos oficiales de `dados.anvisa.gov.br/dados/`
  (windows-1252), con URL, `Last-Modified`, bytes y sha256 en `extra.officialFile`.
  Los espejos de la pasada 1 dejaron de usarse.
- **Marca de diagnóstico publicada por ANVISA**: `extra.anvisaPetitions` lleva las
  áreas de interés (`DESC_AREA_INTERESSE`: «Dispositivos Médicos para Diagnóstico
  in Vitro», «Produtos para diagnóstico de uso in vitro», «Dispositivos Médicos»,
  «Produtos para Saúde (Correlatos)») y los asuntos de las peticiones primarias
  (`DESC_ASSUNTO_PETICAO`: «IVD - Registro de produto», «EQUIPAMENTO - …»,
  «MATERIAL - …») de los archivos `CICLO_ANALISE_PETICOES_PROD_SAUDE_IN_VITRO.CSV`,
  `CICLO_ANALISE_PETICOES_PRODUTO_SAUDE(CORRELATOS).CSV` y
  `CICLO_ANALISE_PETICOES_PRODUTO_SAUDE.CSV`, unidos por número de proceso exacto
  (los modelos toman el proceso de su registro en `TA_PRODUTO_SAUDE_SITE.csv`).
  Cruza el 86 % de los registros; el resto queda sin marca.

- Clasificación del registro: **nombre técnico** ANVISA (`NOME_TECNICO`, sin
  código publicado) → `deviceTypeSystem: br:anvisa-nome-tecnico`; clase de
  riesgo I–IV → `br:I`…`br:IV`.
- Fabricante: `NOME_FABRICANTE` y su país (`NOME_PAIS_FABRIC`, pasado a ISO por
  la tabla cerrada `ANVISA_COUNTRY_ISO`; el nombre original va en
  `extra.manufacturerCountryName`). Si el registro no trae fabricante, va el
  titular y `extra.manufacturerNameFrom: DETENTOR_REGISTRO_CADASTRO`. Más de un
  fabricante → `extra.otherManufacturers`.
- El CNPJ publicado es del **titular**: va en `extra.holder.cnpj` y solo pasa a
  `manufacturerRegistryId` (`cnpj:`) cuando el fabricante es la misma razón social.
- `status`: `VALIDADE_REGISTRO_CADASTRO` verbatim («VIGENTE» o la fecha de vencimiento).
- Modelos: `DS_MODELO_PRODUTO_MEDICO` verbatim (a veces es una presentación,
  p. ej. «Kit para 90 testes»); el id de fila es `registro|modelo`.

### `pmda-approvals` (Japón)

- Desde la pasada 7, cuando el 一般的名称 es letra por letra un nombre del maestro
  JMDN de PMDA (医療機器基準データベース, `std.pmda.go.jp`, 4496 nombres al
  2026-09-30), `extra.deviceTypes` lleva código JMDN de 8 dígitos, clase (Ⅰ–Ⅳ),
  類別 (p. ej. `器16` 体温計) y 中分類, con `joinedBy: exact-name`. Cruza el 95 %
  (33 498 de 35 298). `deviceTypeCode` y `riskClass` siguen en null: la clase y el
  código salen del nombre, no del trámite. El maestro completo va aparte en
  `out/nomenclature-jmdn.json.gz` (listado en `manifest.nomenclatures`).
  La base no tiene descarga masiva ni robots.txt: `fetch-pmda-jmdn.mjs` busca
  por clase (Ⅰ–Ⅳ suman las 4496) y pide las fichas en 45 lotes de 100, con 2 s
  de pausa; las páginas crudas quedan con su sha256 en `official/pmda-jmdn/index.json`.

- Clasificación: **一般的名称** (término JMDN, sin código en la fuente) → `jmdn`.
  Nombres en japonés, sin traducir.
- `manufacturerName`: el titular japonés (製造販売業者); `manufacturerCountry`
  queda en null porque no es necesariamente quien fabrica. `corporate_number`
  → `jp-corporate-number:`.
- La fuente no publica clase de riesgo: `riskClass` null. Categoría (新医療機器,
  後発医療機器, 認証品目, …) en `extra.category`.
- Un mismo trámite publicado en dos listados queda en una fila, con la segunda
  cita en `extra.alsoListedIn`. 3 filas sin titular no salen.

### `hc-mdall` (Canadá)

- Una fila por identificador de dispositivo (número de modelo o catálogo) de
  cada licencia, activa o archivada; `brandName` es el nombre de la licencia.
- MDALL no publica nomenclatura de tipo: `deviceType*` en null; el tipo de
  licencia (System, Test Kit, Single Device, …) en `extra.licenceType`.
- Clase `appl_risk_class` 1–4 → `ca:I`…`ca:IV`; país e id de la compañía
  (`hc-company:`) de `company.json`.
- El espejo es de **2020-02-07**: licencias posteriores faltan (hueco en el manifiesto).

### `tga-daen` (Australia)

- No es el ARTG: son los dispositivos de las notificaciones de eventos adversos
  (sobre todo implantables). Una fila por ARTG + nombre comercial + modelo.
- Clasificación: término GMDN sin código → `gmdn-pt`; clase verbatim → `au:Class IIa`,
  `au:Class 3 - IVD`, … (si un mismo dispositivo trae varias, van en `extra.deviceClassifications`).
- Los pickles del espejo se convierten con un unpickler que rechaza toda clase
  (`tga-daen-pickles.py`); la narrativa del evento no se exporta.

### `cdsco-import-licences` (India)

- Una fila por dispositivo de cada licencia de importación (`IMP/MD/…`); el id
  es `licencia#S No.` (número de fila de la propia lista).
- Clasificación: nombre del dispositivo (`Name of Device`, sin código) →
  `in:cdsco-device-name`; clase `Class A`–`Class D` → `in:A`…`in:D`.
- Fabricante: el sitio legal (`Legal Manufacturing Site`) o, si no hay, el real;
  la razón social es lo que va antes del primer «, » (coma y dos espacios),
  separador de la propia exportación. País por la tabla cerrada `CDSCO_COUNTRY_ISO`.
  Todos los sitios van en `extra.manufacturingSites` y el texto original en
  `extra.manufacturingSitesText`; el importador en `extra.importer`.
- `Model Numbers` verbatim, con el botón «… Show More … Show Less» de la página
  resuelto al texto completo; «NIL» es vacío. Puede listar varios modelos en
  un solo texto: no se parte para no cortar descripciones con comas.
- Faltan las licencias de fabricación nacional y las de autoridades estatales (hueco).

### `tfda-devices` y `tfda-tudid` (Taiwán)

- `tfda-devices`: una fila por licencia (許可證字號); las líneas repetidas por
  fabricante quedan en `extra.otherManufacturers`. Clasificación del 醫療器材分類
  分級管理辦法: 醫器次類別一 → `tw:tfda-classification` con código (p. ej.
  `A.1485` 黃體激素試驗系統) y las categorías principales (p. ej. `A`
  臨床化學及臨床毒理學, `B` 血液學、病理學及基因學, `C` 免疫學及微生物學, que son
  las de diagnóstico in vitro) en `extra.deviceTypes`. Clase 1–3 → `tw:1`…`tw:3`.
  País del fabricante tal cual (ya viene en ISO alfa-2). Registro QMS/QSD de la
  planta → `tw-tfda-qms:`. Nombres en chino tal cual; el inglés en `extra.englishName`.
- `tfda-tudid`: una fila por UDI-DI + modelo (型號) + licencia. El TUDID no
  publica fabricante ni clase: se toman de la licencia por número exacto
  (`extra.licenceFrom: tfda-devices`); 41 DI con licencia desconocida no salen.

## Filtro «diagnóstico»

No se recortó: `out/` lleva **todos** los dispositivos de cada registro, como
permite el README común. El recorte lo hace `master/` con su taxonomía. Para
eso, cada fuente aporta su propia clasificación: nombre técnico y clase de
ANVISA, JMDN de PMDA, tipo de licencia de MDALL («Test Kit», «System») y
GMDN más la marca «IVD» de la clase en DAEN, y nombre del dispositivo y
clase de CDSCO.
