# Alergias: investigación, pasadas de saturación y cobertura

> Pedido del propietario: «absolutamente todas las alergias que existen», varias
> pasadas hasta que sea imposible encontrar más, con estándares reales y sin datos
> inventados. Sesión del 2026-10-24.

## Resumen

- **55 503 conceptos** reales, deduplicados, con procedencia por concepto, en 12
  code systems y 16 value sets. **17 510** tienen nombre **oficial** en
  castellano (HPO 16 882, Open Food Facts 628). El resto conserva el nombre de su
  fuente en inglés y lo declara (`display_language = en`). Nada se tradujo.
- **Saturación sobre las fuentes alcanzables**: 20 pasadas. Las tres últimas (18,
  19 y 20) aportaron **0** cada una. El techo real lo pone la red: la política
  de esta sesión bloquea (403) las fuentes de referencia de alergología (IUIS,
  ICD-11, openFDA/UNII, RxNav vigente, NCIt, ChEBI completo, UniProt, EUR-Lex,
  Codex, Wikidata). La lista está en «Huecos»: esa cobertura no es alcanzable
  desde este contenedor.
- **Enumeraciones FHIR en la API**: los seis campos de catálogo de
  `clinical.allergy_intolerances` y `clinical.allergy_reactions` (tipo,
  categoría, criticidad, estado clínico, verificación y severidad de la reacción)
  quedan gobernados por enumeraciones completas de HL7. Hay 15 conceptos nuevos
  y se reutilizan los 5 que ya existían. Cada opción lleva su nombre y su
  definición en castellano, que son **traducción del proyecto, no oficial**.
- **Sin DDL.** Todo entra en las tablas existentes del módulo 03 (`terminology`)
  y en las enumeraciones del sistema. No hace falta cambiar el repositorio del
  modelo.

## Paso 0: cómo estaba

- `clinical.allergy_intolerances` ya modela FHIR AllergyIntolerance, con
  `substance_concept_id`, `type_`, `category_`, `criticality_`,
  `clinical_status_` y `verification_status_concept_id`, todos FK a
  `terminology.catalog_concepts`. `clinical.allergy_reactions` tiene
  `manifestation_concept_id` y `severity_concept_id`.
- Sólo había **5 conceptos** de alergia (`CLIN.ALLERGY_*`: activa, confirmada,
  tipo alergia, categoría medicamento, criticidad alta), sin enumeración que los
  ofreciera ni designación en castellano. **No había ningún catálogo de
  sustancias ni de manifestaciones**: el alta recibía un uuid cualquiera.
- El patrón para corpus grandes es `tools/terminology-import/` (fuentes fuera de
  git, NDJSON común y cargador idempotente con ids deterministas). Este trabajo
  lo sigue: `tools/terminology-import/allergies/`.

## Qué se entrega

| Pieza | Dónde | Qué hace |
|---|---|---|
| Conceptos FHIR que faltaban | `src/common/seed/data/allergies/allergy.concepts.ts` | 15 conceptos (`ALG.*`), prefijo propio `clinical-allergy` |
| Enumeraciones | `src/common/seed/data/allergies/allergy-dynamic-enums.ts` | 6 enumeraciones, una por campo; se esparcen en `DYNAMIC_ENUM_CATALOG` |
| Castellano | `src/common/seed/data/allergies/allergy-designations.es.ts` | nombre y definición de las 20 opciones (traducción del proyecto) |
| Correspondencia HL7 | `src/common/seed/data/allergies/fhir-allergy-enum-codes.json` | concepto interno ↔ sistema, código y versión HL7. La lee el importador para los `concept_maps` |
| Importador | `tools/terminology-import/allergies/` | `fetch-` (descarga) → `build-` (NDJSON y pasadas) → `load-` (Postgres) |
| Datos normalizados | `tools/terminology-import/allergies/data/` | NDJSON comprimido (4,3 MB), informe de pasadas, manifiesto de fuentes y `SHA256SUMS`. Los crudos (~1 GB) no se suben: se rebajan con el script |
| Fuentes y licencias | `tools/terminology-import/allergies/SOURCES.md` | artefacto, commit o versión, SHA-256, licencia y evidencia |

Las tres líneas que tocan archivos compartidos son aditivas:
`module-concepts.ts`, `dynamic-enum-catalog.ts` y
`terminology-designations.es.ts` esparcen, cada uno, un arreglo propio.

## Protocolo de saturación: registro de pasadas

«Nuevos» = conceptos que quedaron en el catálogo después de deduplicar por
(code system, código) y por equivalencias **declaradas por la fuente** (Mondo
`equivalentTo` → DOID). No se deduplicó por parecido de nombre: eso sería
inventar equivalencias.

| # | Fuente (independiente) | Leídos | Nuevos | Duplicados | Descartes y motivo |
|---|---|---:|---:|---:|---|
| 1 | HL7 FHIR R5 5.0.0 + HL7 Terminology 7.0.1: `allergy-intolerance-type/-category/-criticality`, `reaction-event-severity`, `allergyintolerance-clinical/-verification`, `reaction-event-certainty`, `allerg-intol-substance-exp-risk`, tablas v2 0127/0128/0436/0438 | 50 | 50 | 0 | — |
| 2 | VSAC «Clinical Drug Ingredient» (2.16.840.1.113762.1.4.1010.7; RxNorm 05052025, TTY IN/PIN/MIN/BN) | 27 019 | 21 923 | 0 | 5 096 marcas comerciales (BN según el value set VSAC 1237.18): la alergia se registra al ingrediente |
| 3 | VSAC «Medication Drug Class» (2.16.840.1.113883.3.88.12.80.18; NDF-RT 20180301) | 12 994 | 12 994 | 0 | — |
| 4 | VSAC «CVX Vaccines Administered Vaccine Set» (1010.6) | 235 | 235 | 0 | — |
| 5 | Resto de value sets con CVX: VSAC (p. ej. 80.22 «Complete Set») y PHIN VADS 934/7448 | 846 | 40 | 806 | 3 códigos administrativos («no vaccine administered», «unknown…», «RESERVED»); 1 sólo en un value set de PHIN VADS que no es de vacunas administradas |
| 6 | VSAC «Medicinal Ingredients RXNORM» (1237.22, IN/PIN/MIN) | 21 923 | **0** | 21 923 | — (coincide exactamente con la pasada 2 sin marcas, lo que confirma esa resta) |
| 7 | Value sets de VSAC sobre alergia con RxNorm («Penicillin Allergy RXNORM»…) | 0 | **0** | — | 10 240 códigos RxNorm de producto (SCD/SBD), que no son sustancias. A los ingredientes ya cargados se les anota en qué agrupamiento de VSAC aparecen (`vsac_allergy_value_sets`) |
| 8 | HPO 2026-09-01 («Phenotypic abnormality», con «Allergy» como subárbol) + traducción oficial al castellano | 19 178 | 19 178 | 0 | 2 131 traducciones descartadas porque traducen una etiqueta inglesa que ya cambió |
| 9 | Disease Ontology 2026-09-30, DOID:1205 «allergic disease» | 176 | 176 | 0 | — |
| 10 | Mondo, MONDO:0005271 «allergic disease» | 36 | 15 | — | 21 que Mondo declara `equivalentTo` un DOID ya cargado: su id Mondo se guarda en el DOID |
| 11 | Open Food Facts: alérgenos | 26 | 26 | 0 | la entrada «none» |
| 12 | Open Food Facts: aditivos con número E | 725 | 725 | 0 | 17 entradas sin número E (clases, agrupadores) |
| 13 | Barrido léxico «allergy/allergic» en DOID, Mondo y HPO fuera de los subárboles | 0 | **0** | — | 13 candidatos no cargados: la propia ontología no los clasifica como alergia (11 veterinarios «non-human animal», la susceptibilidad genética a rinitis alérgica y el síndrome SAM). Una excepción, MONDO:0021202 «allergic otitis media», queda anotada para revisión |
| 14 | PHIN VADS: value sets HL7 v2 de alergia | 12 | **0** | 12 | — |
| 15 | ChEBI (extracto publicado por ECTO 2026-07-28): químicos con rol «allergen» (CHEBI:50904) y clases «drug/metal/metal cation/penicillin allergen» | 86 | 86 | 0 | — |
| 16 | OAE 2026-04-15: «allergy AE» (OAE:0000568) y descendientes | 35 | 35 | 0 | — |
| 17 | FoodOn 2026-09-20: «food allergen labelling» (FOODON:03510213) y sus 19 categorías | 20 | 20 | 0 | — |
| 18 | HL7 Chile CL Core 1.9.4 y HL7 Europe EU Base 2.0.0-ballot | 0 | **0** | — | no traen CodeSystem ni ValueSet de alergia propios (sólo perfiles que enlazan SNOMED CT o HL7) |
| 19 | Symptom Ontology 2026-07-30 | 3 | **0** | — | «urticaria», «anaphylactic shock», «allergic reaction»: ya están en la HPO con castellano oficial y SYMP no declara equivalencia. No se duplican |
| 20 | ECTO: exposiciones a alérgenos | 3 | **0** | — | son exposiciones, no sustancias; la sustancia ya entró en la pasada 15 |

**Criterio de parada:** las pasadas 18, 19 y 20 aportaron 0 seguidas, y no
queda ninguna fuente **alcanzable desde esta red** que no se haya revisado. Las
fuentes ausentes no son «imposibles de encontrar»: están bloqueadas (ver
«Huecos», con el aporte esperado de cada una).

### Fuentes evaluadas y descartadas

| Fuente | Motivo |
|---|---|
| SNOMED CT de los paquetes VSAC/PHIN VADS (21 369 sustancias, 85 clases de fármacos, 6 085 alérgenos de PHIN VADS, IPS) | Licencia de país miembro; Bolivia no lo es. No se leen |
| Marcas RxNorm (BN) | No son sustancias; 5 096 descartadas |
| LOINC «Specific IgE Testing for Allergies» (VSAC, 1 560 pruebas) | Son pruebas de laboratorio (corresponden a la sesión de análisis). Sacar el alérgeno del nombre de la prueba sería inferir |
| OAE fuera de «allergy AE» | Eventos adversos generales, no alergias |
| FoodOn, «allergenic hazard material» | Clases sin descendientes |

## Cobertura

### Por code system

| Code system | Conceptos | Con castellano oficial | Fuente |
|---|---:|---:|---|
| `allergy-rxnorm-ingredients` | 21 923 | 0 | RxNorm (VSAC) |
| `allergy-hpo` | 19 178 | 16 882 | HPO + traducción oficial |
| `allergy-ndfrt-drug-classes` | 12 994 | 0 | NDF-RT (VSAC): 10 473 Chemical/Ingredient, 1 865 PE, 627 MoA, 29 TC |
| `allergy-off-additives` | 725 | 614 | Open Food Facts |
| `allergy-cvx-vaccines` | 275 | 0 | CVX (VSAC + PHIN VADS) |
| `allergy-doid` | 176 | 0 | Disease Ontology |
| `allergy-chebi` | 86 | 0 | ChEBI (vía ECTO) |
| `allergy-hl7-fhir` | 50 | 0 | HL7 FHIR / THO |
| `allergy-oae` | 35 | 0 | OAE |
| `allergy-off-allergens` | 26 | 14 | Open Food Facts |
| `allergy-foodon` | 20 | 0 | FoodOn |
| `allergy-mondo` | 15 | 0 | Mondo |
| **Total** | **55 503** | **17 510** | |

### Por categoría del pedido (value sets)

| Categoría | Value set | Conceptos | Comentario |
|---|---|---:|---|
| Todas las sustancias | `allergy-substances` | 36 029 | El selector de `substance_concept_id` |
| Medicamentos por principio activo | `allergy-substances-medication-ingredient` | 21 923 | IN/PIN/MIN de RxNorm, incluidos extractos alergénicos y biológicos registrados como ingrediente |
| Medicamentos por clase | `allergy-substances-drug-class` | 12 994 | NDF-RT, incluidas las clases químicas (penicilinas, sulfonamidas, cefalosporinas…) |
| Vacunas y biológicos | `allergy-substances-vaccine` | 275 | CVX: vacunas, inmunoglobulinas, antitoxinas, tuberculina |
| Pólenes | `allergy-substances-rxnorm-pollen` | 323 | regla léxica sobre el nombre RxNorm |
| Venenos | `allergy-substances-rxnorm-venom` | 36 | ídem (abeja, avispas, véspidos, hormiga de fuego) |
| Ácaros | `allergy-substances-rxnorm-house-dust-mite` | 5 | ídem |
| Epitelios, pelo, caspa, plumas | `allergy-substances-rxnorm-animal-epithelia` | 53 | ídem |
| Extractos alergénicos (todos: pólenes, hongos, insectos, alimentos, epitelios) | `allergy-substances-rxnorm-allergenic-extract` | 702 | ídem |
| Alimentos (alérgenos de rotulado) | `allergy-substances-food-allergen` | 26 | Open Food Facts: los 14 del anexo II UE (con nombre en castellano) y otros 12 sin castellano (naranja, kiwi, banana, durazno, manzana, carne vacuna, cerdo, pollo, gelatina, yamaimo, matsutake, caviar rojo) |
| Aditivos | `allergy-substances-food-additive` | 725 | números E |
| Contacto, ocupacionales y fármacos (químicos) | `allergy-substances-chemical-allergen` | 86 | ChEBI: isocianatos, anhídridos, formaldehído, quaternium-15, PPD, metales (níquel, cromo, cobalto, berilio, cobre), penicilinas… |
| Látex | dentro de `allergy-substances` | 1 | RxNorm «latex» (1314891). «Latex allergy» también como condición (HPO HP:0500094 «Alergia al latex», DOID:0060532) y como evento adverso (OAE:0006922) |
| Rotulado de alérgenos alimentarios | `allergy-food-allergen-labelling` | 20 | FoodOn (categorías UE + cacao, cilantro, maíz, zanahoria, legumbres) |
| Tipos de alergia (condiciones) | `allergy-conditions` | 221 | HPO «Allergy» (30, con castellano), DOID (176) y Mondo (15) |
| Tipos de evento adverso alérgico | `allergy-adverse-event-types` | 35 | OAE |
| Manifestaciones de la reacción | `allergy-manifestations` | 19 178 | HPO «Phenotypic abnormality», el equivalente abierto del «clinical finding» que pide FHIR |

Los grupos léxicos de RxNorm son **navegación, no clasificación clínica**. Cada
concepto lleva la regla en `category_rule`, como ya hace el glosario.

### Medición en Postgres desechable

Se levantó un PostgreSQL 16 local y se aplicó el DDL vendorizado
(`database/SQL/00_shared` y `03_terminology`, sin las FK diferidas a `iam`).
Se sembraron los 3 361 conceptos internos que crea `TerminologySeedService`,
con los mismos ids (generados desde `CONCEPT_DEFS` y `MODULE_CONCEPT_SEEDS`).
Después se corrió el cargador dos veces:

| Tabla | 1.ª corrida | 2.ª corrida |
|---|---:|---:|
| `catalog_concepts` | 55 503 | 0 |
| `concept_designations` | 99 639 | 0 |
| `concept_properties` | 354 869 | 0 |
| `concept_relationships` (is-a) | 24 187 | 0 |
| `value_sets` / `value_set_versions` | 16 / 16 | 0 / 0 |
| `value_set_members` | 92 631 | 0 |
| `concept_maps` (enumeración ↔ HL7) | 20 | 0 |
| `catalog_import_batches` | 12 | 12 (se registra cada corrida, como en los otros cargadores) |

Duración: 20 s la primera corrida y 11 s la segunda. Se probó también la carga
incremental: al sumar las pasadas 15–17 sobre una base ya cargada, entraron 141
conceptos nuevos y la corrida siguiente insertó 0.

### Cómo lo consulta la API, y lo que hoy no consulta nadie

- Las seis enumeraciones se publican por `system-context` como cualquier otra.
- La búsqueda de sustancias y manifestaciones ya existe:
  `GET /terminology/concepts?q=…&valueSetId=<id>&lang=ES`. Los ids son
  deterministas (`deterministicId('seed:value-set:<código>')`), por ejemplo
  `allergy-substances` = `f3b91de2-a30b-5d83-92e9-07c3c21e8bcd` y
  `allergy-manifestations` = `18068043-df40-5b9e-996b-8a80c037d1ed`.
- **Riesgo de rendimiento conocido** (ya anotado en
  `tools/terminology-import/README.md`): `searchConcepts` materializa todos los
  miembros del value set en un `IN`. Con `allergy-substances` (36 029) y
  `allergy-manifestations` (19 178) conviene resolverlo con `JOIN`/`EXISTS`
  antes de exponerlo con usuarios.
- **Lo que hoy no lee ninguna consulta**:
  - Las propiedades `allergy_provenance`, `external_ids`,
    `vsac_allergy_value_sets`, `ndfrt_kind`, `e_number`, `efsa_evaluation` y
    `chebi_allergen_roles`: 354 869 filas, en total, de `concept_properties`.
    Son la procedencia que exige la regla del pedido, y ningún endpoint las
    devuelve todavía, salvo `$expand?includeProperties=true`.
  - Las relaciones is-a: 24 187 filas, para navegar la jerarquía.
  - Los value sets `allergy-adverse-event-types` (35) y
    `allergy-food-allergen-labelling` (20): ningún campo del modelo los usa;
    sirven para farmacovigilancia y rotulado.
  - Los 50 conceptos HL7 cargados por el importador sólo sirven de destino de
    los `concept_maps` (interoperabilidad FHIR).

## Huecos

### Bloqueados por la red de esta sesión (403 del proxy; ver `SOURCES.md`)

| Hueco | Fuente que lo cierra | Aporte esperado |
|---|---|---|
| Moléculas alergénicas por especie (Ara h 1, Bet v 1, Der p 1…) | WHO/IUIS allergen.org; UniProt KW-0020 | ~1 000 alérgenos con nomenclatura oficial |
| Pólenes, hongos, epitelios y alimentos por especie, con UNII | openFDA NDC (allergenics) + FDA GSRS/UNII | miles de extractos con identificador UNII. Aquí sólo entran los que RxNorm registra como ingrediente |
| Categorías de alergia e hipersensibilidad en castellano oficial | WHO ICD-11 MMS (es) | capítulo 4A8x y códigos de extensión de sustancias |
| RxNorm vigente y clases MED-RT/EPC | RxNav/RxClass | la expansión usada es RxNorm 05052025 y NDF-RT 20180301 (NDF-RT ya fue reemplazado por MED-RT) |
| ChEBI completo (rol «allergen») | EMBL-EBI | el extracto de ECTO no es exhaustivo |
| Jerarquía «Allergen» del NCI Thesaurus | NCI EVS | |
| Texto oficial en castellano de los 14 alérgenos UE y de los números E | EUR-Lex | hoy el castellano sale de Open Food Facts, que no es oficial |
| Lista Codex de alimentos que causan hipersensibilidad, y los 9 alérgenos FDA | FAO/Codex, FDA | |
| Series de pruebas de parche (serie basal europea, NACDG, T.R.U.E. Test) | publicaciones ESCD/NACDG, DailyMed | |
| Nombres en castellano de RxNorm, NDF-RT, CVX, DOID, Mondo, ChEBI, OAE y FoodOn | Wikidata (CC0), por RxCUI/UNII/Mondo/ChEBI | 38 000 conceptos siguen en inglés |
| CVX con estado oficial (activo, inactivo, nunca activo) | CDC | 40 códigos vienen de value sets sin estado |

### Con licencia que no tenemos

- **SNOMED CT** (sustancias, alergias, hallazgos, edición en castellano). El
  Global Patient Set tiene licencia propia: revisar si cubre a un país no
  miembro.
- **DeCS** (BIREME/OPS): hay que pedir licencia y token.
- **WHO ATC**: la redistribución comercial exige permiso.
- **AGEMED** (Bolivia): reCAPTCHA. Se pide por acceso a información pública.

### Decisiones a confirmar con el propietario

1. **Open Food Facts (ODbL)**: el uso interno con atribución está cubierto. Si
   los aditivos y alérgenos alimentarios se van a redistribuir, esa parte tiene
   que publicarse bajo ODbL.
2. **Varias condiciones con el mismo nombre en distintas fuentes** (por ejemplo,
   «rinitis alérgica» en HPO, DOID y OAE). No se fusionaron porque ninguna
   fuente declara la equivalencia. Hay que decidir si la pantalla muestra una
   sola fuente por defecto (sugerencia: DOID para condiciones, HPO para
   manifestaciones).
3. **Las traducciones de las 20 opciones de las enumeraciones** son del
   proyecto. Se reemplazan si HL7 publica la oficial.

## Cambios al repositorio del modelo

**Ninguno.** Todo entra en `terminology.*` y en las enumeraciones del sistema.
`clinical.allergy_intolerances` no tiene columnas para `reaction-event-certainty`
ni para `allerg-intol-substance-exp-risk` (FHIR R5). Sus códigos HL7 se cargan
igual, como catálogo, por si el modelo las incorpora.

## Cómo reproducirlo

```sh
node tools/terminology-import/allergies/fetch-allergy-sources.mjs     # red: npm + GitHub; ~1 GB fuera de git
node tools/terminology-import/allergies/build-allergy-catalog.mjs     # sin red: NDJSON + informe de pasadas (~1 min)
node tools/terminology-import/allergies/load-allergy-catalog.mjs --dry-run
node tools/terminology-import/allergies/load-allergy-catalog.mjs      # .env DB_*; exige que la API haya sembrado terminology
node tools/terminology-import/allergies/load-allergy-catalog.mjs --from-repo  # sin descargar: usa allergies/data/allergy-catalog.ndjson.gz
node --test "tools/terminology-import/allergies/test/*.test.mjs"      # 12 pruebas con extractos reales
```
