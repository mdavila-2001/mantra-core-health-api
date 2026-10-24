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

| `source` | Autoridad (país) | Archivo oficial | Espejo (commit) | Corte del dato | Filas |
|---|---|---|---|---|--:|
| `anvisa-produtos` | ANVISA (BR) | Produtos para saúde, datos abiertos (`dados.anvisa.gov.br/dados/`) | [victoracioly/g.stec](https://github.com/victoracioly/g.stec) `8a4c6ca3` · `dispositivos_medicos_anvisa/data/dispositivos_raw.csv` (sha256 `65be2169…`) | 2025-06-17 | 93 770 |
| `anvisa-produtos-modelos` | ANVISA (BR) | Produtos para saúde con modelos (`DS_MODELO_PRODUTO_MEDICO`) | [adnanioricce/DHsys](https://github.com/adnanioricce/DHsys) `81800583` · `src/Tools/Helper/Csvs/Produtos/{0..32}_produto_saude_modelo.csv` (árbol `91d42c7a…`) | 2020-12-25 | 1 027 762 |
| `pmda-approvals` | PMDA (JP) | 医療機器の承認品目一覧 y 認証品目リスト (Excel por año fiscal) | [zoefcuk/pmda-medical-devices](https://github.com/zoefcuk/pmda-medical-devices) `d829883b` · `index.html`, JSON embebido (sha256 `3e14d600…`) | trámites hasta 2026 | 35 298 |
| `hc-mdall` | Health Canada (CA) | MDALL, API pública (licencias, compañías, identificadores) | [misterrPink1/symmetric](https://github.com/misterrPink1/symmetric) `a43a1a58` · `datasets.zip` (sha256 `e2a3f451…`) | 2020-02-07 (`last_refresh_dt`) | 2 333 236 |
| `tga-daen` | TGA (AU) | DAEN, notificaciones de eventos adversos de dispositivos | [tobinsouth/MedicalDeviceNLP](https://github.com/tobinsouth/MedicalDeviceNLP) `868d2e2a` · `data/medical_device_summaries/*.csv` + `data/list_of_reports/*.pickle` | reportes hasta 2021 | 18 917 |

Conteos exactos y por archivo: `out/manifest.json`. Cobertura: `COVERAGE.md`.

## Licencias y términos de uso

| Fuente | Datos (autoridad) | Espejo |
|---|---|---|
| ANVISA | Datos abiertos del Poder Ejecutivo federal de Brasil (Decreto nº 8.777/2016). La licencia exacta del conjunto no se pudo leer desde la nube: **por verificar** en la ficha del conjunto. | g.stec: sin licencia publicada. DHsys: MIT (cubre el código del repo; los CSV son datos de ANVISA). |
| PMDA | Listados públicos de PMDA. Los términos de reutilización del sitio de PMDA no se pudieron leer desde la nube: **por verificar**. | Sin licencia publicada; el propio espejo se declara «参考用» (de referencia) y remite al Excel oficial. |
| Health Canada | MDALL figura en el Portal de Gobierno Abierto de Canadá (Open Government Licence – Canada según el portal; **por verificar** la ficha). | Sin licencia publicada. |
| TGA | Contenido de la TGA, con el aviso de DAEN de que una notificación no prueba que el dispositivo causó el evento. Términos de reutilización **por verificar**. | Sin licencia publicada. |

Ninguna fuente se usó para algo distinto de catalogar dispositivos. No se
eludieron CAPTCHAs ni `robots.txt`: lo bloqueado quedó como hueco.

## Qué se toma de cada fuente

### `anvisa-produtos` y `anvisa-produtos-modelos` (Brasil)
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

## Filtro «diagnóstico»

No se recortó: `out/` lleva **todos** los dispositivos de cada registro, como
permite el README común. El recorte lo hace `master/` con su taxonomía. Para
eso, cada fuente aporta su propia clasificación: nombre técnico y clase de
ANVISA, JMDN de PMDA, tipo de licencia de MDALL («Test Kit», «System») y
GMDN más la marca «IVD» de la clase en DAEN.
