# Vocabularios de interoperabilidad abiertos — hueco, estado y carga (2026-10-28)

Carril C11 cierre de huecos de terminología. Importador: `tools/terminology-import/interop-vocab/` (README, SOURCES.md con licencias leídas).
Evidencia: `docs/trabajo/2026-10-27-terminologia-cierre-huecos/evidencia/C11/` (incluye `REPORTE-C11.md`).

## Hueco

El módulo 03 (`terminology.*`) no tenía los vocabularios con los que el producto intercambia datos: los code systems y value sets de HL7/FHIR
(estados, géneros, tablas v2, v3, etc.), las unidades UCUM completas, CVX/MVX (vacunas y fabricantes) ni los identificadores de idioma, país,
escritura y moneda. Antes de este carril el repo versionaba, en otros carriles, solo: 6 code systems de HL7 THO 7.0.1 (479 conceptos) y la tabla
de UCUM de `@lhncbc/ucum-lhc` (888 unidades) en `lab-tests/`, las enumeraciones de HL7 de AllergyIntolerance y el CVX de alergias (`allergies/`).
Las sesiones del 2026-10-24 no habían podido bajar nada de esto por el 403 de la red; la del 2026-10-27/28 sí llega a `packages.fhir.org`,
`registry.npmjs.org`, el CDC, IANA, `raw.githubusercontent.com` y Wikidata.

## Estado hoy (re-sondeo del 2026-10-28)

| Fuente | HTTP hoy | Resultado |
|---|---|---|
| HL7 THO 7.5.0 (`packages.fhir.org/hl7.terminology.r4/7.5.0`) | 200 | cargado (versión más nueva del registro; las otras sesiones usaron 7.0.1) |
| FHIR core R4 4.0.1 / R4B 4.3.0 / R5 5.0.0 | 200 | cargado |
| IG de HL7: extensiones R4 5.4.0, genomics-reporting 3.0.0, SDC 4.0.0 | 200 | cargado (US Core 9.0.0: copyright no reconocido; SMART: CC BY 4.0; IPS: sin code systems) |
| UCUM `ucum-essence.xml` (ucum-org/ucum) y su licencia | 200 | cargado |
| CDC `cvx.txt`, `mvx.txt`, `tradename.txt` | 200 | cargado |
| CDC `agencymaterials.html` (política) | **403** | no accesible: licencia de CVX/MVX por inferencia federal |
| IANA `language-subtag-registry` y términos | 200 | cargado |
| CLDR 49 (`cldr-core`, `cldr-localenames-full`, `cldr-numbers-full`) | 200 | cargado |
| Wikidata SPARQL (P300) | 200 | cargado |
| SIX (ISO 4217), SIL (ISO 639-3), LoC (ISO 639-2), UNSD (M49) | 200 | **no se cargan**: licencia que lo impide o no declarada (SOURCES.md) |
| iso.org (OBP, listas, normas) | **403** | no se abre; el texto de las normas no se carga |

## Qué se cargó

Corpus versionado en `tools/terminology-import/interop-vocab/data/` (4,7 MB, gzip determinista, `SHA256SUMS`).

| Capa | Code systems (ediciones) | Conceptos | Value sets (ediciones) | Notas |
|---|---|---|---|---|
| HL7 THO 7.5.0 | 905 | 19 445 | 2 416 | tablas v2, v3, observación, consentimiento, etc.; 705 NamingSystem (id, URI y OID de sistemas de código e identificación) |
| FHIR core R5 / R4B / R4 | 432 / 514 / 1 028 | 4 621 / 4 840 / 16 594 | 617 / 546 / 1 135 | ediciones separadas del mismo code system; la más nueva queda por defecto |
| IG de HL7 (extensiones, genómica, SDC) | 52 / 12 / 12 | 387 / 194 / 65 | 61 / 9 / 11 | |
| UCUM (essence 2.2, 2024-06-17) | 2 | 336 (312 unidades + 24 prefijos) | — | `ucum` como otra versión del code system que ya carga `lab-tests`; prefijos aparte |
| CVX / MVX (CDC) | 2 | 290 / 89 | — | estado verbatim, 225 marcas comerciales unidas por CVX y MVX exactos |
| IANA subtags | 7 | 9 296 | — | 8 276 idiomas (ISO 639), 258 extlang, 225 escrituras (ISO 15924), 305 regiones (ISO 3166-1 alfa-2 + UN M.49), 139 variantes, 93 etiquetas «grandfathered»/redundantes |
| CLDR 49 (en/es) | 5 | 1 545 | — | 295 territorios (alfa-3, numérico, FIPS, contención, monedas por región), 674 idiomas, 215 escrituras, 55 variantes, 306 monedas ISO 4217 |
| Wikidata P300 | 1 | 5 254 | — | códigos ISO 3166-2 con etiquetas en/es; 96 códigos ambiguos y 12 inválidos fuera |
| ConceptMap de FHIR | — | — | — | 1 230 pares entre conceptos cargados (de 2 120 posibles) |
| **Total** | **2 972 ediciones / 1 566 code systems** | **62 956 filas (43 937 pares code system/código distintos)** | **4 795 versiones (3 258 value sets), 75 070 miembros** | |

### Antes / después en un Postgres 16 desechable (puerto 55451, DDL de `00_shared` + `03_terminology`)

| | Antes (tras sembrar los 16 conceptos internos) | Después (1.ª corrida) | 2.ª corrida |
|---|---|---|---|
| `catalog_concepts` | 16 | 62 972 | +0 |
| `code_systems` / `code_system_versions` | 1 / 1 | 1 567 / 2 973 | +0 |
| `value_sets` / `value_set_versions` / `value_set_members` | 0 / 0 / 0 | 3 258 / 4 795 / 75 070 | +0 |
| `concept_properties` / `concept_designations` / `concept_relationships` | 0 / 0 / 0 | 413 142 / 15 158 / 13 901 | +0 |
| `concept_maps` / `catalog_import_batches` | 0 / 0 | 1 230 / 2 972 | +0 |

No es la base del stack real: `mantra_redesa_health` no se tocó. En la base real, antes de cargar, hay que correr la consulta de conteo por
`internal_code` del README de `terminology-import/` para saber qué hay hoy.

## Qué no se pudo cargar y por qué (resumen; el detalle está en `data/interop-vocab-coverage.json`)

- **Code systems de HL7 omitidos: 110** de los 3 076 recursos `CodeSystem` de los 7 paquetes (otros 14 son duplicados idénticos de un recurso ya cargado):
  33 con copyright de un tercero (SNOMED, LOINC, ICCBBA, IEEE, WHO ATC…), 15 con editor externo (NEMA/DICOM, ISO, ASTM, ETSI, ADA, W3C), 28 que no son un
  conjunto cerrado (`example`, `not-present`, `fragment`, `supplement`), 10 `complete` sin conceptos, 10 sin licencia declarada, 8 ejemplos del estándar,
  6 que ya carga `lab-tests`.
- **Value sets omitidos: 683** de 5 478 (445 con copyright de terceros, 190 que dependen de un code system no cargado, 22 con copyright no reconocido,
  10 con editor externo, 10 que expanden a 0 miembros por la semántica estricta de filtros, 3 con una versión ausente, 2 que apuntan a `#hacked`, 1 con un filtro no
  soportado). Todo o nada: no hay membresías parciales.
- **ConceptMap**: de 2 120 pares, 841 tienen un extremo fuera del corpus, 44 pertenecen a un mapa con copyright no abierto y 5 tienen una relación sin concepto interno.
- **ISO 3166-2**: 96 códigos con más de un ítem en Wikidata (sin elegir) y 12 valores de P300 sin forma de código; 267 subdivisiones sin etiqueta en español y 41 sin etiqueta en inglés
  (sin completar).
- **ISO 4217/639/3166 oficiales, UN M49**: licencia que impide la redistribución o no declarada (SOURCES.md).

## Qué falta (red, licencia, curaduría) y propuestas

1. **Decisión del propietario** (SOURCES.md): UCUM (licencia sin obras derivadas), CVX/MVX (dominio público inferido; política del CDC en 403), dos copias de CVX
   (`allergies/` y esta), ediciones R4/R4B/R5 triplicadas, `smart-app-launch` (CC BY 4.0).
2. **Nombres de ISO 3166-2 en español/inglés** salen de Wikidata (colaborativo); para los 96 ambiguos hace falta curaduría.
3. **Propuesta de modelo (no se escribió DDL)**: (a) `concept_maps` no guarda la relación original ni la versión del mapa por separado; hoy va en `context`/`version`.
   (b) `catalog_concepts.replaced_by_concept_id` queda vacío: IANA publica `Preferred-Value` y FHIR `replacedby`, pero rellenarlo exige una segunda pasada que actualice filas.
   (c) Faltan conceptos internos de idioma para `de`, `nl`, `fr`, `it`, `pl`, `ru`, `zh`: esas designaciones de THO quedan solo en la propiedad `fhir_designations`.
   (d) No hay dónde guardar metadatos del code system (descripción, copyright, `hierarchyMeaning`, propiedades definidas): están en `interop-vocab-codesystems.ndjson.gz`.
4. **Producto**: nada de esto aparece en `/glossary` mientras `ConceptsService.searchConcepts` se acote a los 64 términos curados (decisión del propietario, no se tocó).
