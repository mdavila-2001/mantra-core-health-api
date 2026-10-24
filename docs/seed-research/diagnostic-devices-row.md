# Equipos de diagnóstico — registros del resto del mundo (fuera de EE. UU. y Europa)

Estado: **bloqueado por la red del entorno**. No se cargó ninguna fila: no hay
datos inventados ni transcritos a mano.

## Pasada 0 — discovery (2026-10-24)

### Dónde guardaría el modelo estos datos

- `diagnostic_units.diagnostic_equipment` (`src/modules/diagnostic_units/entities/diagnostic_equipment.entity.ts`)
  guarda **equipos instalados** de una sede: `equipment_type_concept_id` y
  `modality_concept_id` apuntan a `terminology.catalog_concepts`; `manufacturer`
  y `model` son texto libre por instancia.
- `terminology.*` (módulo 03) puede alojar los **tipos** de dispositivo como
  `catalog_concepts` de un `code_system` por clasificación (GMDN, JMDN,
  clasificación NMPA, etc.), y atributos por `concept_properties`, como ya se
  hizo con `ndc` (fabricante, forma, etc.).
- **No existe** un catálogo de fabricantes, marcas, modelos ni registros
  sanitarios de dispositivos. No se crean tablas desde la API (ADR-0021); la
  propuesta para `mantra-core-technologies/mantra-core-health-model` queda a
  cargo de la sesión de consolidación (`justin/seed-dx-devices-master`).

### Fuentes: acceso desde este contenedor

El proxy de salida del entorno rechaza el túnel (`403` en `CONNECT`) a todos
los hosts de las fuentes asignadas. Solo responden `api.github.com`,
`registry.npmjs.org` y `pypi.org`.

| País / ente | Host probado | Resultado |
|---|---|---|
| Canadá · Health Canada MDALL | `health-products.canada.ca` | 403 del proxy |
| Australia · TGA ARTG | `www.tga.gov.au` | 403 del proxy |
| Brasil · ANVISA datos abiertos | `dados.anvisa.gov.br` | 403 del proxy |
| Colombia · INVIMA (datos.gov.co) | `www.datos.gov.co` | 403 del proxy |
| China · NMPA UDI | `udi.nmpa.gov.cn` | 403 del proxy |
| Taiwán · TFDA (data.gov.tw) | `data.gov.tw` | 403 del proxy |
| Israel · AMAR (data.gov.il) | `data.gov.il` | 403 del proxy |
| Singapur · HSA (data.gov.sg) | `data.gov.sg` | 403 del proxy |
| Japón · PMDA | `www.pmda.go.jp` | 403 del proxy |
| Corea · MFDS (data.go.kr) | `www.data.go.kr` | 403 del proxy |
| India · CDSCO | `cdsco.gov.in` | 403 del proxy |
| OMS · Prequalification IVD | `extranet.who.int` | 403 del proxy |
| Bolivia · AGEMED | `www.agemed.gob.bo` | 403 del proxy |
| México · datos.gob.mx | `datos.gob.mx` | 403 del proxy |
| Argentina · datos.gob.ar | `datos.gob.ar` | 403 del proxy |
| Perú · datos abiertos | `www.datosabiertos.gob.pe` | 403 del proxy |
| UNICEF Supply Catalogue | `supply.unicef.org` | 403 del proxy |
| Arabia Saudita · SFDA | `medicaldevice.sfda.gov.sa` | 403 del proxy |
| Tailandia · Thai FDA | `open.fda.moph.go.th` | 403 del proxy |
| Malasia · MDA | `portal.mda.gov.my` | 403 del proxy |

Descartado como sustituto:

- Espejos de terceros en GitHub: están fuera del alcance de repositorios de la
  sesión y no son la fuente oficial.
- Lectura por herramienta de resumen web: el texto pasa por un modelo y no
  garantiza filas literales; no sirve como procedencia.
- Escribir parsers sin un archivo real contra el cual validarlos (mismo
  criterio que `tools/terminology-import/README.md`, fase 2).

### Para desbloquear

Agregar estos hosts en *Network access → Allowed domains* del entorno (o subir
el nivel de acceso), según https://code.claude.com/docs/en/cloud-environments#network-access,
y relanzar la sesión: el loop de saturación arranca desde la pasada 1.
