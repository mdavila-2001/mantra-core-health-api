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
