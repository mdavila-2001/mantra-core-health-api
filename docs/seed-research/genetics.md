# Genética: genes, familias, condiciones, tipos de variante y listas controladas

> Cierre de huecos de terminología, carril C12, sesión del 2026-10-28. Pedido del propietario: cargar todo lo que las fuentes **abiertas y con licencia leída hoy**
> permitan, con procedencia por fila y nada inventado ni traducido. Importador en `tools/terminology-import/genetics/`
> ([`README.md`](../../tools/terminology-import/genetics/README.md), [`SOURCES.md`](../../tools/terminology-import/genetics/SOURCES.md)). Evidencia en
> `docs/trabajo/2026-10-27-terminologia-cierre-huecos/evidencia/C12/`.

## Hueco → estado hoy → qué se cargó

**Hueco.** Ningún code system de genética estaba cargado: el repo no tenía HGNC (salvo el de `dictionaries/`, ver más abajo), ni NCBI Gene, ni MedGen, ni las
listas controladas de ClinVar y ClinGen, ni la sintaxis HGVS ni los términos de VRS (`antes-grep.txt`). Las sesiones del 2026-10-24 no podían bajar nada (403).

**Estado hoy.** Los hosts responden (`resondeo-2026-10-28.tsv`: 40 de 45 URL en 200; los 2 × 404 son `clinvar/gene_specific_summary.txt` y `medgen/gene_condition_source_id`, que no existen en esas rutas
(el segundo vive en `clinvar/gene_condition_source_id`, que sí responde); los 3 × 403 son páginas HTML de `github.com`, mientras `raw.githubusercontent.com`, que es lo que se descarga, responde).

**Qué se cargó** en un Postgres 16 desechable (no la base del stack), sin DDL:

| Code system | Qué es | Conceptos | Designaciones | Propiedades | Relaciones | Cruces |
|---|---|---:|---:|---:|---:|---:|
| `hgnc` | genes humanos aprobados (HGNC, CC0) | 45 289 | 147 106 | 906 500 | 36 538 `part-of` | 44 498 → `ncbi-gene-hs` |
| `hgnc-gene-group` | grupos (familias) de genes, con jerarquía | 2 572 | 2 572 | 31 421 | 1 740 `is-a` | 0 |
| `ncbi-gene-hs` | NCBI Gene, Homo sapiens, todos los tipos | 194 025 | 462 116 | 2 986 303 | 0 | 45 192 → `hgnc` |
| `medgen` | condiciones y fenotipos genéticos con nombre de fuente abierta | 101 277 | 368 812 | 1 723 923 | 58 763 `is-a` | 81 538 (MeSH, MONDO, NCIt, OMIM, Orphanet) |
| `sequence-ontology` | Sequence Ontology (CC BY 4.0) | 2 409 | 6 216 | 26 087 | 2 517 `is-a` | 0 |
| `clinvar-terms` | listas controladas de las 4 plantillas de envío, del XSD y categorías de condición | 349 | 349 | 3 846 | 0 | 0 |
| `clinvar-functional` | consecuencias funcionales (SO) y tipos de ensayo (EFO/OBI/FBbi) | 56 | 56 | 560 | 0 | 36 → `sequence-ontology` |
| `clingen-terms` | valores controlados de validez, dosis y accionabilidad (CC0) | 103 | 103 | 1 236 | 0 | 0 |
| `hgvs-syntax` | elementos y tipos de variante de la sintaxis HGVS | 43 | 43 | 495 | 0 | 0 |
| `ga4gh-vrs` | clases y enumeraciones del esquema VRS 2.0.1 (Apache-2.0) | 48 | 48 | 581 | 15 `is-a` | 0 |
| **Total** | | **346 171** | **987 421** | **5 680 952** | **99 573** | **171 264** |

**Conteos antes / después** (Postgres desechable, sin nada de genética antes): `catalog_concepts` 0 → 346 171 en estos 10 code systems. La base de la prueba quedó con
480 096 conceptos en total: 346 171 de este carril + 86 221 del catálogo de enfermedades (cargado para probar los cruces contra destinos reales) + 47 686 del HGNC/SO de `dictionaries/` + 18 conceptos internos
que siembra el andamio de la prueba. 2.ª corrida: **0 filas nuevas en las 5 tablas** y conteos de tablas idénticos (`carga-genetica-2.txt`, `idempotencia.txt`).

Lo versionado pesa **37 MB** (`data/`: 19 archivos `.gz` más `MANIFEST.json` y `SHA256SUMS`; la parte más grande pesa 6,5 MB; sin comprimir el corpus son 886 MB). No hace falta cortar nada: el límite de ~300 MB
queda 8 veces por encima y todas las partes están muy por debajo de los 45 MB. Cada parte se verifica con `SHA256SUMS` (`sha256-gzip-check.txt`: 20 de 20 en OK y `gzip -t` en los 19 `.gz`).

## Cómo es cada fila (procedencia y verbatim)

- **Código y nombre** tal cual los publica la fuente: `HGNC:5` / `A1BG`; GeneID `1` / `A1BG`; CUI `C0000735`; `SO:0001483` / `SNV`. Donde la fuente no publica códigos
  (listas de ClinVar y ClinGen) el código es `<lista>:<valor>` armado con el texto verbatim, y la lista dice de dónde sale.
- **Procedencia por concepto** (propiedades `source`, `source_record_id`, `source_url`, `source_version`, `source_retrieved_at`, `source_input_sha256` —nombre y SHA-256 de
  cada archivo que lo alimenta—, `source_license`). `integridad-final.txt` §5: 0 conceptos con alguna de las ocho incompleta.
- **Definiciones** sólo donde la fuente las trae (SO, grupos HGNC, MedGen vía NCI/MONDO/Orphanet/MeSH/MedlinePlus, HGVS y VRS): van en `source_definition` con su idioma, no en
  la columna `definition` (la API la muestra como castellano). Ninguna se redactó. Todo está en inglés; no se tradujo nada.
- **Cruces por código exacto** que la fuente publica (HGNC `entrez_id` ↔ NCBI `dbXrefs`, MedGen → MONDO/MeSH/Orphanet/NCIt/OMIM, ClinVar → SO). Sólo si el destino existe en la
  base; la equivalencia queda nula (un xref no afirma equivalencia exacta). `integridad-final.txt` §10 comprueba que el código de destino figura entre los xrefs del origen.
  Contra destinos reales (el catálogo de enfermedades del repo cargado en la misma base): MedGen → 15 740 MeSH, 23 328 MONDO, 21 675 + 461 NCIt, 11 338 OMIM, 8 996 Orphanet.
  **No** hay cruces a HPO: ese code system no se carga sin aprobación del propietario (ver Decisiones).
- **Relaciones.** `is-a` donde la fuente lo declara (SO, grupos HGNC, `isa` de NCI en MedGen, herencia en VRS) y `part-of` (gen → grupo). Las jerarquías de MeSH, Orphanet y GTR de MedGen
  no afirman `is-a`: quedan en `source_hierarchy_parents` con su fuente. 69 filas `isa` de NCI tienen CUI padre = CUI hijo (dos códigos de NCI en un CUI): no son aristas (se
  detectó con `integrity.sql` §7 en la primera carga y se corrigió; sigue en la propiedad).
- **Datos que sólo viven en propiedades**: `medgen_condition_links` (gen ↔ CUI, 5 180 genes, sin el nombre de la condición), `retired_ids` de HGNC (2 862 genes), `retired_cuis` de
  MedGen (MERGED, historial de MedGen y `ConceptID_history` de ClinVar), `source_roles` (roles de NCI/GTR/Orphanet entre CUI), `clinvar_condition_categories` (46 344 CUI).

## Qué quedó afuera y por qué (re-sondeado hoy)

| Qué | Motivo exacto |
|---|---|
| 135 335 de los 236 612 CUI de MedGen | sus únicos nombres son de SNOMED CT, OMIM o GeneReviews (licencia). Se cuentan en `coverage.json`; no se carga ningún texto de esas fuentes |
| Nombres y definiciones de **HPO** dentro de MedGen (45 681 átomos, 16 913 definiciones) | la cláusula «personal, noncommercial use» del sitio de HPO sigue sin resolver (`symptoms/lib/approvals.mjs`). Sólo se conserva el identificador `HP:…` como xref. **No cuesta conceptos**: ningún CUI queda sin cargar por esto (`cuisDroppedWithHpoName` = 0 en `coverage.json`: todos los que tienen nombre de HPO tienen además de GTR, MONDO, NCI, Orphanet o MeSH) |
| 152 de 188 consecuencias funcionales de ClinVar | son de **FENICS** (Functional Epilepsy Nomenclature for Ion Channels): su licencia no está verificada |
| 68 631 nombres de `disease_names` | 19 248 son de HPO, 422 de OMIM y 17 357 no declaran fuente. Sólo se cargó la categoría (7 valores) y el vínculo por CUI |
| Afirmaciones por gen de ClinGen (3 716 de validez, 1 719 de dosis, 636 de accionabilidad) | son datos, no vocabulario. Se cargaron los 103 valores controlados |
| Variantes individuales de ClinVar (`variant_summary` y Evidence Repository) | fuera de alcance: millones de registros que no son vocabulario |
| OMIM, GeneReviews, COSMIC, PharmGKB/ClinPGx, DECIPHER, SNOMED CT, MedDRA | licencia |
| NCBI `gene_history`, `gene_group`, `gene_orthologs`, `gene_summary`, `gene2*`; MedGen `MGSAT`, `NAMES`, `pubmed_lnk` | datos o texto, no vocabulario (listado completo y motivo por archivo en `saturacion-2026-10-28.txt`) |
| Gene groups: 37 pertenencias de `gene_has_family.csv` | apuntan a ids que no están entre los 45 289 aprobados (27 figuran en `withdrawn.txt`; los otros 10 no figuran en ninguno de los dos archivos) |

## Saturación

Pasada 1: descubrimiento de archivos en cada directorio (MedGen, ClinVar, plantillas de ClinVar, NCBI Gene, descargas de ClinGen, HGNC, SO, HGVS, VRS). Aportó las 3 plantillas de ClinVar
que faltaban, `MERGED`/historiales de MedGen y ClinVar, `withdrawn.txt` de HGNC y los TSV de accionabilidad de ClinGen. Pasada 2, **después** de cargar: se volvieron a listar
los mismos directorios y la página de descargas de ClinGen y se clasificó cada archivo: **0 archivos nuevos sin clasificar** (`saturacion-2026-10-28.txt`). Ningún cero salió de un error
de red: los listados devolvieron 200 con 18, 8, 5 y 15 archivos y 21 enlaces.

## Solapamiento con `dictionaries/` (C7): hay que decidir

`dictionaries/` ya carga `hgnc` (JSON, 45 277 genes, versión 2026-10-24) y `sequence-ontology` (commit `4340c143…`), con su propio `internal_code` y URL canónica. Para no crear dos
sistemas paralelos, este importador usa **el mismo `internal_code` y la misma URL canónica** (`http://www.genenames.org/geneId`, `http://purl.obolibrary.org/obo/so.owl`),
reusa el code system si ya existe y su versión **no le quita el `is_default`** a la otra. Se probó cargando ambos en la misma base (`coexistencia.txt`): 1 code system por sistema,
2 versiones cada uno, ninguna FK rota, la versión de C7 sigue por defecto y 0 duplicados por (versión, código). Entre versiones sí hay códigos repetidos
(45 275 en `hgnc`, 2 409 en `sequence-ontology`): son dos publicaciones del mismo sistema, no un error. El propietario decide cuál es la versión por defecto (la de este carril trae
53 columnas de HGNC, grupos, ids retirados y definiciones de SO con sus referencias; la de C7 es anterior y más corta) o si se descarta una. La URL de HGNC es la que `dictionaries/` declara registrada
en HL7 THO; **no pude verificarla** (la página de HL7 consultada respondió 404).

## Decisiones del propietario

1. **HPO**: ¿se aprueba el uso de sus nombres y definiciones dentro de MedGen? Si sí, `OPEN_NAME_SABS`/`OPEN_DEF_SABS` en `lib/medgen.mjs` y volver a construir.
2. **Versión por defecto** de `hgnc` y `sequence-ontology` (arriba).
3. **FENICS** (152 términos de ClinVar): verificar licencia.
4. **Licencia de NCBI**: el aviso «Molecular Data Usage» dice que algunos remitentes pueden reclamar derechos sobre parte de los datos y que NCBI no puede dar permiso irrestricto. Se conserva en `source_license` de cada fila; el propietario decide si lo acepta para NCBI Gene/MedGen/ClinVar.
5. **NCBI Gene**: 128 261 de los 194 025 genes son `biological-region` (regiones de control, etc.); se cargaron todos y la propiedad `type_of_gene` permite cortar por tipo.
6. **Atribución** pedida por CC BY 4.0 (SO, MONDO, NCI, Orphanet), por NLM y por ClinGen (fecha de acceso: está en cada fila) al mostrar los datos en el producto.

## Propuestas (no se aplicó nada; sin DDL, ADR-0021)

- **Evidencia por relación.** `concept_relationships` no guarda fuente ni versión; acá la procedencia de una arista es la del concepto de origen. El parche
  `2026-10-25_v4250_terminology_relationship_evidence.sql` del repo del modelo lo resolvería, pero ese repo **no existe en esta máquina**: no se pudo aplicar ni probar. Bloqueo declarado.
- **Producto.** `ConceptsService.searchConcepts` acota a 64 términos curados: nada de lo cargado aparece en `/glossary` hasta que el propietario cambie eso (propuesta, no diff).
- **Gen ↔ enfermedad.** ClinGen validez (3 716), `gene_condition_source_id` (14 219) y accionabilidad (636) son afirmaciones con fuente y fecha. Si se las quiere como relaciones, el patrón de
  `drug-treatments/` (afirmación como concepto con sus propiedades) es el que no necesita DDL; no se hizo porque son datos y no vocabulario.

## Evidencia por área (escalera de `AGENTS.md` §1.1)

| Área | Peldaño | Evidencia |
|---|---|---|
| Parsers y plan de carga | `TESTED` | `node --test`: 41 de 41 contra extractos reales (`node-test-genetics.txt`) |
| Build y empaque | `VERIFIED` | 2 builds → mismo SHA-256 de los 10 NDJSON; 2 empaquetados → mismo `SHA256SUMS`; `unpack` reconstruye byte a byte (`build-reproducible-sha256.txt`, `unpack.txt`, `sha256-gzip-check.txt`) |
| Carga en Postgres desechable | `VERIFIED` | 1.ª corrida, 2.ª = 0 en las 5 tablas, integridad (`carga-genetica-1/2.txt`, `integridad-final.txt`, `idempotencia.txt`) |
| Cruces contra destinos reales | `VERIFIED` | MONDO, MeSH, Orphanet, NCIt y OMIM del catálogo de enfermedades cargado en la misma base; HPO no existe |
| Base real del stack, API y UI | no cubierto | nada se corrió contra `mantra_redesa_health` ni contra el frontend |
