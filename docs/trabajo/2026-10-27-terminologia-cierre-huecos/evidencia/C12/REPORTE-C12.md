# Reporte C12 — genética (transcrito del informe final del implementador; la herramienta rechazó su escritura)

- Commits: 38e6a47 (código, tests, data/) y 27d805a (doc, plan y evidencia) · Peldaño: parsers TESTED; carga VERIFIED solo en Postgres 16 desechable (borrado). Sin REGRESSION_VERIFIED. Sin revisión independiente al momento de transcribir. PLAN-C12 marca M5 "A MEDIAS".
- Antes 0 → después (10 code systems nuevos, sin DDL): hgnc 45 289 · hgnc-gene-group 2 572 · ncbi-gene-hs 194 025 · medgen 101 277 · sequence-ontology 2 409 · clinvar-terms 349 · clinvar-functional 56 · clingen-terms 103 · hgvs-syntax 43 · ga4gh-vrs 48. Total 346 171 conceptos, 987 421 designaciones, 5,68 M propiedades, 99 573 relaciones (is-a / part-of), 171 264 cruces por código exacto.

## Probado
node --test 41/41 contra extractos reales. 2 builds, 2 empaques y unpack dan los mismos hashes. Carga 1 y 2.ª = 0 filas en las 5 tablas. Integridad: 0 huérfanos, 0 duplicados por (versión, código), 0 nulos, 0 procedencia incompleta. Cruces contra destinos reales (catálogo de enfermedades en la misma base): MeSH 15 740, MONDO 23 328, NCIt 22 136, OMIM 11 338, Orphanet 8 996. Saturación posterior a la carga: 0 archivos nuevos. La verificación detectó 69 is-a de un concepto de MedGen hacia sí mismo: corregido con prueba.

## Peso versionado
37 MB (mayor parte 6,5 MB, SHA256SUMS); no hace falta cortar.

## Coordinación
dictionaries/ (C7) ya carga hgnc y sequence-ontology. C12 usó el mismo internal_code y URL canónica: un solo code system con dos versiones; la carga de C12 no le quita is_default a la de C7. Convivencia probada en la misma base. Entre versiones hay códigos repetidos (45 275 en hgnc, 2 409 en SO).

## Decisiones del propietario
1. Qué versión de HGNC y SO es la predeterminada. 2. Textos de HPO dentro de MedGen quedan fuera hasta resolver la cláusula no comercial; nombres y definiciones de SNOMED, OMIM y GeneReviews tampoco entran: 135 335 CUI sin cargar. 3. Licencia de FENICS: 152 términos fuera. 4. Aviso "Molecular Data Usage" de NCBI conservado en source_license. 5. Cortar por type_of_gene: 128 261 genes son biological-region.

## Falta / bloqueado
Evidencia por relación: el parche del repo del modelo no existe en esta máquina. Carga en la base real, API y UI: no tocadas. Registro HL7 de la URL de HGNC: 404, no verificado. Afirmaciones gen–enfermedad no cargadas (son datos, no vocabulario).
