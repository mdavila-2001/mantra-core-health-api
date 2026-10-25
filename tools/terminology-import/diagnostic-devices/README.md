# Equipos de diagnóstico: formato de intercambio común

Cuatro sesiones construyen el catálogo mundial de equipos de diagnóstico:

| Carpeta | Rama | Alcance |
|---|---|---|
| `us/` | `justin/seed-dx-devices-us` | FDA (GUDID, 510(k), PMA, De Novo, registro y listado, clasificación) |
| `eu/` | `justin/seed-dx-devices-eu` | EUDAMED, MHRA, Swissmedic |
| `row/` | `justin/seed-dx-devices-row` | Resto del mundo (ANVISA, Health Canada, TGA, PMDA, NMPA, MFDS, CDSCO, COFEPRIS, AGEMED, …) |
| `master/` | `justin/seed-dx-devices-master` | Une las tres salidas: **tipo de equipo → fabricante → marca → modelo**, con todos los registros de cada modelo |

Cada región escribe **solo** dentro de su carpeta. `master/` lee las salidas
de las otras tres y no las modifica.

## Dónde va la salida de cada región

```
tools/terminology-import/diagnostic-devices/<región>/out/
  manifest.json                         # obligatorio, ver abajo
  <source>.ndjson.gz                    # o partido: <source>-0001.ndjson.gz, -0002, …
```

- NDJSON en UTF-8 (un objeto JSON por línea, sin BOM, `\n` como fin de línea),
  comprimido con gzip.
- Cada archivo `.gz` pesa **menos de 50 MB** (GitHub rechaza los de más de
  100 MB). Si una fuente no entra, se parte en `-0001`, `-0002`, … sin cortar
  una línea a la mitad.
- `<source>` es el mismo valor que el campo `source` de sus filas.

### `manifest.json`

```json
{
  "region": "us",
  "generatedAt": "2026-10-24T03:00:00Z",
  "formatVersion": 1,
  "files": [
    {
      "path": "fda-gudid-0001.ndjson.gz",
      "source": "fda-gudid",
      "sourceVersion": "gudid_full_release_20261001",
      "rows": 412345,
      "sha256": "…"
    }
  ],
  "gaps": [
    { "source": "…", "reason": "403 del proxy | CAPTCHA | licencia | términos de uso | robots.txt", "url": "…" }
  ]
}
```

`gaps` lista lo que no se pudo obtener. Un hueco documentado vale más que una
fila inventada.

## Una fila = un registro de un modelo en una fuente

Una fila describe **un** dispositivo (un modelo o versión, o una UDI-DI) tal
como aparece en **una** fuente oficial. Si el mismo modelo figura en cinco
registros, son cinco filas: `master/` las une.

| Campo | Tipo | Oblig. | Qué lleva |
|---|---|---|---|
| `source` | string | sí | Clave estable de la fuente, en minúsculas con guiones: `fda-gudid`, `fda-510k`, `fda-pma`, `fda-denovo`, `fda-rl`, `eudamed-udi`, `mhra-pard`, `swissmedic-swissdamed`, `anvisa-produtos`, `hc-mdall`, `tga-artg`, `pmda-…`, `nmpa-…`, `mfds-…`, … |
| `sourceRecordId` | string | sí | Id del registro **en esa fuente**, sin transformar (número de 510(k), UUID de EUDAMED, número ARTG, …). Junto con `source` identifica la fila. |
| `sourceUrl` | string | sí | URL donde se ve ese registro (ficha), o la URL del archivo masivo si la fuente no tiene ficha por registro. |
| `sourceVersion` | string | sí | Versión o fecha de corte del archivo o la API (nombre del release, `Last-Modified`, `meta.last_updated`). |
| `retrievedAt` | string | sí | Fecha y hora de descarga, ISO 8601 con zona (`2026-10-24T03:00:00Z`). |
| `deviceTypeCode` | string \| null | sí | Código del tipo de dispositivo en la nomenclatura que use la fuente. |
| `deviceTypeSystem` | string \| null | sí | Nomenclatura de `deviceTypeCode`, ver tabla de abajo. |
| `deviceTypeName` | string \| null | sí | Nombre del tipo, verbatim de la fuente. |
| `manufacturerName` | string | sí | Razón social **verbatim** de la fuente. No la normalicen: la normalización la hace `master/` y guarda el original. |
| `manufacturerCountry` | string \| null | sí | ISO 3166-1 alfa-2 del fabricante si la fuente lo da (o la dirección permite saberlo sin adivinar). |
| `manufacturerRegistryId` | string \| null | sí | Id del fabricante **en un registro publicado**, con prefijo de esquema: `srn:DE-MF-000012345`, `fei:3002807468`, `fda-reg:…`, `duns:…` (si la fuente lo publica), `lei:…`, `cnpj:…`, `artg-sponsor:…`. Si hay varios, va el más fuerte y el resto en `extra.manufacturerIds`. |
| `brandName` | string \| null | sí | Marca comercial verbatim (`brandName` de GUDID, `tradeName` de EUDAMED, …). |
| `model` | string \| null | sí | Modelo, versión o número de catálogo, verbatim (`versionModelNumber`, `catalogNumber`, `reference`, …). |
| `udiDi` | string \| null | sí | UDI-DI primaria si existe. |
| `riskClass` | string \| null | sí | Clase de riesgo con el esquema de la fuente: `fda:1`, `fda:2`, `fda:3`, `eu-mdr:IIa`, `eu-ivdr:C`, `ca:III`, `jp:II`, … |
| `authorizationId` | string \| null | sí | Número de autorización o registro (K-number, PMA, número ANVISA, número ARTG, número de certificado, …). |
| `authorizationDate` | string \| null | sí | Fecha de la decisión o del registro, `YYYY-MM-DD`. |
| `status` | string \| null | sí | Estado verbatim de la fuente (`Published`, `On the market`, `Cancelled`, `Ativo`, …). |
| `extra` | object | no | Todo lo demás que la fuente publique y sirva (otros códigos de tipo, Basic UDI-DI, dirección, descripción, GMDN además del product code, …). |

Todos los campos obligatorios aparecen en todas las filas; si la fuente no da
un valor, va `null`. Nunca se rellena con un valor deducido. Si hay
`deviceTypeSystem`, va con `deviceTypeCode`, con `deviceTypeName` o con los
dos: hay nomenclaturas que se publican solo con nombre (GMDN en GUDID sin
código, «nome técnico» de ANVISA, 一般的名称 de la JMDN).

### Valores de `deviceTypeSystem`

| Valor | Nomenclatura |
|---|---|
| `fda-product-code` | Product code de tres letras de la FDA (Product Classification Database) |
| `emdn` | European Medical Device Nomenclature (código alfanumérico, p. ej. `W0101010101`) |
| `gmdn` | Código GMDN de 5 dígitos (solo si la fuente lo publica) |
| `gmdn-pt` | Nombre del término preferido GMDN sin código (GUDID publica el nombre y la definición) |
| `jmdn` | Japanese Medical Device Nomenclature (一般的名称) |
| `cnd` | Classificazione Nazionale dei Dispositivi (Italia) |
| `<país>:<esquema>` | Cualquier otra nomenclatura nacional, con el ISO alfa-2 delante: `br:anvisa-nome-tecnico`, `kr:mfds-class`, `cn:nmpa-classification`, … |
| `who:<esquema>` | Clasificación de la OMS, que no es de un país (p. ej. `who:assay-format` de la precalificación de IVD) |

Si un registro trae **varios** tipos (GUDID: product code y GMDN), el
principal va en `deviceTypeCode`/`deviceTypeSystem`/`deviceTypeName` y los
demás en `extra.deviceTypes`:

```json
"extra": {
  "deviceTypes": [
    { "system": "gmdn-pt", "code": null, "name": "Haematology analyser IVD, automated", "definition": "…" }
  ]
}
```

## Reglas

- Procedencia por fila: `source`, `sourceRecordId`, `sourceUrl`,
  `sourceVersion`, `retrievedAt` son la cita; no hay filas sin ellas.
- Nada fabricado: ni modelos, ni marcas, ni códigos, ni mapeos entre
  nomenclaturas. Un mapeo entre nomenclaturas solo existe si una fuente lo
  publica (por ejemplo, el product code y el GMDN que la misma UDI-DI declara
  en GUDID).
- Licencias y términos de uso de cada fuente, en el `SOURCES.md` de cada
  región. GMDN exige membresía para su nomenclatura completa: solo se usa lo
  que publican fuentes abiertas (GUDID).
- No se eluden CAPTCHAs ni `robots.txt`. Lo bloqueado va a `gaps`.
- Filtro de «diagnóstico»: cada región puede exportar todo lo que baje; el
  recorte a equipos de diagnóstico lo hace `master/` con la taxonomía
  publicada (ver `master/README.md`). Si una región ya recortó, que lo diga en
  su `SOURCES.md` con el criterio usado.
