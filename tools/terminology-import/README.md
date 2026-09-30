# Importadores de terminología médica

ETL reales (no seeds escritos a mano) que cargan catálogos oficiales de
terminología clínica a `terminology.*` desde fuentes públicas verificadas.
Cada script es idempotente (`ON CONFLICT DO NOTHING` sobre UUIDs
deterministas `md5('mantra:<fuente>:...')::uuid`) y puede re-ejecutarse sin
duplicar datos.

> [!aviso] «Ya importados» describe los SCRIPTS, no cualquier base concreta
> (TAREA-25, 2026-09-02) La tabla de abajo dice qué ETL existe, está
> validado y produjo esos conteos **en algún entorno donde se corrió** —
> no que la base que tenés adelante los tenga cargados. Verificado contra
> `mantra_redesa_health` (stack `mantra-redesa`, 2026-09-02):
>
> ```sql
> SELECT cs.internal_code, count(*)
>   FROM terminology.catalog_concepts cc
>   JOIN terminology.code_system_versions csv ON csv.id = cc.code_system_version_id
>   JOIN terminology.code_systems cs ON cs.id = csv.code_system_id
>  GROUP BY 1 ORDER BY 2 DESC;
> --  mantra-core-internal | 8934
> --  SALUD_CORE           | 1365
> --  vademecum            |   17
> --  CODE_SYSTEMS_01      |   12
> -- (10 328 conceptos en total; NINGUNA fila de icd10cm/loinc/rxterms/
> --  rxnorm_full/ndc/hcpcs/nucc_taxonomy — los siete `code_system` de la
> --  tabla de abajo)
> ```
>
> Los siete importadores existen, corren y son idempotentes — eso es lo que
> certifica esta tabla —, pero **ninguno se ejecutó contra este stack**.
> Antes de escribir «el eje de terminología ya tiene 458 mil conceptos» o
> planificar una tarea asumiendo esos datos, corré la consulta de arriba
> contra la base que vas a usar.

> [!aviso] `import-ndc.mjs` SÍ se corrió contra `mantra_redesa_health_e2e`
> (carril FT-25, 2026-09-04). Verificado con la misma consulta:
>
> ```
> --  ndc                  | 135002
> --  mantra-core-internal |   8954
> --  vademecum            |     17
> ```
>
> 135 002 `catalog_concepts` (product_ndc únicos) + 649 475 `concept_properties`
> (`manufacturer`, `dosage_form`, `route`, `active_ingredients`, `product_type`)
> insertados de una corrida limpia (0 conflictos, re-ejecutable sin duplicar).
>
> **Esto NO alcanza para que el glosario (`/glossary`) muestre fichas de
> medicamento.** `ConceptsService.searchConcepts` acota toda lectura del
> glosario a los miembros del value set `glossary-all-terms`
> (`glossary-terms.catalog.ts`, 64 términos curados a mano), y ninguno de esos
> 64 términos —incluido el curado «Paracetamol», `categoryKey: 'pharmacology'`—
> es miembro del `code_system` `ndc` ni tiene sus `concept_properties`
> enlazadas a un producto NDC concreto. Vincular un término curado genérico
> (p. ej. «Paracetamol») a UN producto comercial específico de los 135 002
> importados sería elegir un fabricante/forma farmacéutica arbitrario para
> representar el genérico — una decisión de curación de contenido, no un ETL,
> y por eso queda fuera de esta corrida (ver P-25-1 en
> `glossary-drug-facts.ts`). El catálogo `ndc` queda disponible en la base para
> quien resuelva esa curación.

## Fuentes ya importadas (públicas, sin cuenta necesaria)

| Script | Fuente | code_system | Conceptos reales |
|---|---|---|---|
| `import-icd10cm.mjs` | NLM Clinical Table Search Service | `icd10cm` | 74,719 (100% de cobertura) |
| `import-loinc.mjs` | NLM Clinical Table Search Service (subset público) | `loinc` | 109,325 (100% de cobertura) |
| `import-rxterms.mjs` | NLM RxTerms (subset curado de RxNorm) | `rxterms` | 19,356 RXCUIs |
| `import-rxnorm-full.mjs` | RxNav REST API (RxNorm completo, todos los TTY) | `rxnorm_full` | 110,177 RXCUIs |
| `import-ndc.mjs` | openFDA NDC Directory | `ndc` | 134,748 productos (~98% de cobertura; ver limitación abajo) |
| `import-hcpcs.mjs` | NLM Clinical Table Search Service | `hcpcs` | 8,725 códigos únicos |
| `import-nucc.mjs` | NUCC Health Care Provider Taxonomy (CSV oficial) | `nucc_taxonomy` | 883 especialidades |

Ejecutar cualquiera: `node tools/terminology-import/import-<fuente>.mjs`
(requiere `.env` con `DB_HOST`/`DB_PORT`/`DB_USER`/`DB_PASSWORD`/`DB_NAME`).
Tests de verificación en `test/integration/<fuente>.int-spec.ts`.

### Limitación conocida — NDC (openFDA)
El total reportado por `meta.results.total` de openFDA es ~137,468, pero la
paginación profunda de Elasticsearch subyacente tiene un límite práctico.
El script particiona por `product_type` + rango de `marketing_start_date`
para superar ese límite; con esa estrategia se alcanzó 134,748 (~98%) de
forma estable (0 filas nuevas en corridas repetidas). Cerrar el 2% restante
requeriría particiones más finas (más subrangos de fecha) — no se hizo por
retorno decreciente frente al costo de más llamadas a la API pública.

## Fase 2 — pendiente de acceso UMLS (NO construido a ciegas)

El usuario pidió amplificar hacia SNOMED CT y RxNorm completo (descarga RRF
oficial, no la API pública ya usada). Ambos requieren una cuenta UMLS (NLM)
gratuita:

1. Registro: https://uts.nlm.nih.gov/uts/signup-login
2. Aceptar la UMLS Metathesaurus License Agreement (incluye RxNorm completo
   y LOINC completo; SNOMED CT US Edition si el país está afiliado).
3. Generar una API Key en el perfil UTS.

**Por qué no se escribió ya el parser**: los archivos RRF de UMLS
(`MRCONSO.RRF`, `MRREL.RRF`, `MRDEF.RRF`, etc.) tienen un formato pipe-delimited
específico por release: escribir un parser sin un archivo real contra el cual
validarlo arriesga producir código roto o silenciosamente incorrecto —
exactamente el tipo de dato clínico fabricado que se buscaba evitar en toda
esta iniciativa. Cuando el usuario tenga la API key / los archivos
descargados, avisar para construir y validar el importador de inmediato
contra los archivos reales (`RXNCONSO.RRF` para RxNorm completo,
`sct2_Concept_Full_*.txt` / `sct2_Description_Full_*.txt` para SNOMED CT).

Alcance potencial de fase 2: SNOMED CT US Edition ronda 350,000+ conceptos
activos (y varios millones de filas de relaciones/descripciones); RxNorm RRF
completo añade relaciones ingrediente↔producto que la API pública (ya
importada en `rxnorm_full`) no expone.

## Glosario en castellano — importadores ES (2026-09-30)

Pueblan `/glossary` con términos **en castellano** desde fuentes oficiales o
libres, con procedencia por fila. Dos etapas, siempre separadas:

1. **fetch → NDJSON** (red, reanudable): cada `import-<fuente>.mjs` baja a
   `../glossary-data-build/cache/<fuente>/` (fuera de git; se redefine con
   `GLOSSARY_BUILD_DIR`) y escribe `../glossary-data-build/ndjson/<capa>.ndjson`
   + `<capa>.meta.json` (URL, SHA-256, fecha, conteos, estadísticas HTTP).
2. **load** (base): `load-glossary-es.mjs` lee todas las capas presentes y las
   carga a `terminology.*` con ids deterministas y `ON CONFLICT DO NOTHING`.

Además `build-glossary-shards.mjs` arma los shards estáticos de la maqueta
(`glossary-data-build/shards/`). El esquema de fila y de los shards está en
**`glossary-data-build/SCHEMA.md`** (versión 2; extiende la fila de
`mantra-core-health/data/glossary/00_README.md`).

| Script | Fuente | Capa (`ndjson/`) | Categorías |
|---|---|---|---|
| `import-cie10es.mjs` | Ministerio de Sanidad, tablas de referencia CIE-10-ES 2026 (xlsx oficiales) | `cie10es-diagnosticos`, `cie10es-procedimientos` | Enfermedades, Signos y síntomas, Otros (dx); Procedimientos, Tratamientos, Pruebas diagnósticas, Imagenología (px) |
| `import-cima.mjs` | AEMPS, API REST de CIMA | `cima` | Farmacología clínica (un término por principio activo VTM) |
| `import-medlineplus-es.mjs` | NLM, XML de temas de salud + guías «Pruebas médicas» en español | `medlineplus-es`, `medlineplus-es-pruebas` | según grupo oficial / regla documentada |
| `import-wikidata-anatomy.mjs` | Wikidata (CC0): ítems con id TA98 (P1323)/TA2 (P7173), etiqueta ES y clase «estructura anatómica» (Q4936952) verificada | `wikidata-anatomia` | Anatomía |
| `import-wikidata-images.mjs` | Wikidata P18/P117 + metadatos de Wikimedia Commons | `wikidata-images` (enriquecimiento) | — |
| `import-loinc-es.mjs` | LOINC, variante lingüística ES (**archivo aportado por el usuario**) | `loinc-es` | Laboratorio / Imagenología |

```sh
node tools/terminology-import/import-cie10es.mjs          # ~10 s (2 xlsx)
node tools/terminology-import/import-cima.mjs             # ~1 h la primera vez (≈25 500 detalles + ≈14 000 secciones; concurrencia 4)
node tools/terminology-import/import-medlineplus-es.mjs   # ~6 min (1 pedido/s)
node tools/terminology-import/import-wikidata-anatomy.mjs
node tools/terminology-import/import-wikidata-images.mjs  # ~25 min (13 500 archivos, 50 por pedido, 1 pedido/s)
node tools/terminology-import/build-glossary-shards.mjs   # sin red
node tools/terminology-import/load-glossary-es.mjs --dry-run   # sin base: plan y conteos
node tools/terminology-import/load-glossary-es.mjs             # carga real (.env DB_*; exige el stack arriba)
node --test "tools/terminology-import/test/*.test.mjs"          # parseo con fixtures reales
```

### Reglas que siguen (97.4 / 97.5.4)

- **Nada se redacta.** Nombres, sinónimos y definiciones son **verbatim** de la
  fuente. Si la fuente no trae definición (CIE-10-ES), `definition = null`.
- Las secciones de ficha técnica de CIMA (4.1, 4.2, 4.3, 4.4, 4.8, 5.1) se
  copian verbatim (HTML saneado + texto) **con cita** (nº de registro, sección,
  fecha del documento, URL). Son la ficha de **un producto de referencia** por
  principio activo: el comercializado con número de registro más bajo entre los
  que tienen ficha segmentada (`pickReferenceProduct`, determinista). La
  «definición» de un término de Farmacología es su sección 4.1 con esa cita.
- `reviewStatus = external-source` en todo. Los términos se siembran con estado
  `TERM_ACTIVE` (el glosario oculta los demás): son catálogos oficiales, no
  contenido redactado a revisar. **Supuesto a confirmar con el propietario.**
- **Categoría y etiquetas** salen de la estructura oficial de cada fuente
  (`lib/glossary-es/taxonomy.mjs`): capítulo de CIE-10-ES (R → Signos y
  síntomas; V–Z → Otros; resto → Enfermedades; etiquetas por capítulo y por los
  marcadores Pediátrico/Obstétrico/Perinatal del propio Excel); sección de
  ICD-10-PCS (B, C → Imagenología; 3, 5, 6, 7, 9, D, F0, G, H → Tratamientos;
  4, F1 → Pruebas diagnósticas; resto → Procedimientos); grupo anatómico ATC de
  la OMS para Farmacología; grupos oficiales de MedlinePlus para sus temas.
  Las guías de «Pruebas médicas» no traen clasificación: se usa una **heurística
  sobre el texto de la propia fuente** (título/descripción; queda en
  `categoryRule`) que **no es perfecta** (p. ej. «Prueba de troponina» cae en
  Pruebas diagnósticas y «Fluoroscopia» en Laboratorio). Es navegación, no dato
  clínico.
- **Imágenes**: CIMA trae fotos oficiales (envase y forma farmacéutica) de cada
  medicamento. El resto sale de Wikimedia Commons sólo cuando un ítem de
  Wikidata declara **el mismo código** (ICD-10-CM P4229, CIE-10 P494, MeSH P486,
  ATC P267 → P18 o P117). Se guardan URL, miniatura, autor, licencia, URL de
  licencia y página del archivo (`imageAttribution` es el texto a mostrar).
- **Relaciones**: sólo las que declara la fuente (temas relacionados de
  MedlinePlus). No se infiere enfermedad↔prueba↔tratamiento.

### Modelo de carga (`load-glossary-es.mjs`)

Un `terminology_sources` + `code_systems` + `code_system_versions` por
`codeSystem` (URL canónica interna `https://mantracore.health/fhir/CodeSystem/<codeSystem>`),
`catalog_concepts` (`display` = nombre ES, `definition`), designación preferida y
sinónimos ES, `concept_properties` con los nombres que leen la API (#518) y el front
(`glossary-slug`, `code_system`, `source`, `source_name`, `source_url`,
`source_retrieved_at`, `source_license`, `glossary-clinical-definition`,
`glossary-plain-summary`, `definition_source`, `definition_kind`, `sections`,
`glossary-image`, `drug_facts`, …; lista completa en `glossary-data-build/SCHEMA.md`),
membresías en `glossary-all-terms` + `glossary-category-<k>` + `glossary-tag-<t>`
(mismos ids que `GlossarySeedService`, vía `deterministicId`), relaciones y un
`catalog_import_batches` por capa. Requiere que la API haya arrancado al menos
una vez (value sets y conceptos internos sembrados); si no, aborta con el
faltante. No actualiza filas existentes.

> [!aviso] Rendimiento pendiente (fuera de este alcance)
> `ConceptsService.searchConcepts` materializa **todos** los ids miembros del
> value set y los pasa como `$in` a `catalog_concepts`. Con ~285 000 miembros en
> `glossary-all-terms` eso es un `IN` de 285 000 uuids por búsqueda. Antes de
> cargar el corpus completo en un entorno con usuarios hay que resolver esa
> consulta con un `JOIN`/`EXISTS` contra `value_set_members`.

### Fuentes evaluadas y descartadas

| Fuente | Motivo |
|---|---|
| NANDA-I / NIC / NOC (diagnósticos, intervenciones y resultados de enfermería) | Propietarias (licencia comercial). No se usan. |
| CIE-O-3.2 (Ministerio de Sanidad, `2026_CIE_O_3_2_Tabla_Referencia.xlsx`) | Descargable, pero © OMS además de la traducción del Ministerio; la OMS exige licencia para uso comercial. Se deja fuera hasta confirmarla. |
| DeCS/BIREME (descriptores ES con definición) | API y descarga XML exigen **solicitar licencia** a BIREME/OPS (formulario) y un token. `decs.bvsalud.org` devuelve 403 a clientes no navegador. Acción del usuario. |
| LOINC en castellano | Requiere cuenta en loinc.org y aceptar la licencia. Importador listo (`import-loinc-es.mjs`), **no validado contra un archivo real**. Acción del usuario. |
| MedlinePlus: Enciclopedia A.D.A.M. y monografías de medicamentos | Con copyright (no son dominio público). Sólo se usan temas de salud y pruebas médicas. |
| SNOMED CT (edición en español) | Requiere licencia de país miembro. |
| Cuidados de enfermería | No se encontró una fuente oficial libre en castellano con términos de enfermería; la categoría queda sin aportes de esta importación. |
