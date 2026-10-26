# TAREA-41 F3.0 — Volúmenes medidos (antes de cargar)

Generado por `tools/terminology-import/measure-sources.mjs` el 2026-10-26T02:52:44.065Z. Sin base de
datos: cuenta lo que entraría **después de los filtros** de F3.1 (identidad) y F3.2 (HPO), con
los mismos módulos puros que usará la carga.

## Veredicto

**Total proyectado: 279 012 relaciones** (247 325 enfermedad → fenotipo
de HPO ∪ Orphanet + 31 687 `SUBCLASS_OF` de MONDO). **Queda por debajo de las 800 000 que pide la ficha.** Según F3.0 se informa al propietario antes de seguir, y el hueco no se rellena con fuentes de menor calidad. Falta medir MRCOC (F3.5), Wikidata ampliado (F3.6) y la jerarquía DOID/MeSH/CIE-10 (F3.4); este corte no las incluye.

## Fuentes y versiones

| Archivo | URL | Bytes | SHA-256 | Licencia |
|---|---|---:|---|---|
| `phenotype.hpoa` | https://github.com/obophenotype/human-phenotype-ontology/releases/latest/download/phenotype.hpoa | 35 816 037 | `e89aa39c8f97bf5a…` | HPO license (uso libre con cita, sin modificar términos) — https://hpo.jax.org/license |
| `hp.obo` | https://github.com/obophenotype/human-phenotype-ontology/releases/latest/download/hp.obo | 10 863 613 | `93dace952fcb3ec4…` | HPO license (uso libre con cita, sin modificar términos) — https://hpo.jax.org/license |
| `hp-es.babelon.tsv` | https://raw.githubusercontent.com/obophenotype/human-phenotype-ontology/master/src/translations/hp-es.babelon.tsv | 2 116 349 | `00972e33775a0340…` | HPO license (uso libre con cita, sin modificar términos) — https://hpo.jax.org/license |
| `en_product4.xml` | https://www.orphadata.com/data/xml/en_product4.xml | 47 893 357 | `4f44e8a612013999…` | CC BY 4.0 |
| `en_product9_ages.xml` | https://www.orphadata.com/data/xml/en_product9_ages.xml | 6 948 952 | `38fef7e9e398addb…` | CC BY 4.0 |
| `en_product9_prev.xml` | https://www.orphadata.com/data/xml/en_product9_prev.xml | 16 178 169 | `6b492b3cc61e5a03…` | CC BY 4.0 |
| `es_product1.xml` | https://www.orphadata.com/data/xml/es_product1.xml | 55 912 900 | `3eb547bb9aa0429b…` | CC BY 4.0 |
| `mondo.obo` | http://purl.obolibrary.org/obo/mondo.obo | 53 320 617 | `2631e8e165d41def…` | CC BY 4.0 |
| `mondo.sssom.tsv` | http://purl.obolibrary.org/obo/mondo/mappings/mondo.sssom.tsv | 13 124 886 | `ec15afdb32fab3d3…` | CC BY 4.0 |

Versiones: HPOA `2026-09-02` · hp.obo `hp/releases/2026-09-01` · MONDO `releases/2026-10-06` ·
Orphanet product4 `2026-06-23 07:57:18` · product9 edades `2026-06-23 07:57:51` ·
product9 prevalencias `2026-06-23 07:57:58` · product1 ES `2026-06-23 07:58:18`.
`hp-es.babelon.tsv` se baja de `master` (HPO no lo publica como asset de release); se usan sólo
las filas `rdfs:label` con `translation_status = OFFICIAL`.

## Conteos por fuente

| Fuente | Términos (después de filtros) | Con etiqueta ES oficial | Relaciones (pares únicos) | Filas de evidencia |
|---|---:|---:|---:|---:|
| HPO `phenotype.hpoa` (sin ORPHA) | 9432 fenotipos | 9417 | 150 901 (147 937 positivas) | 151 589 |
| Orphanet product4 | 8694 fenotipos · 4355 trastornos | 8694 fenotipos · 4355 trastornos | 115 418 (18 994 ya en HPO) | 116 664 asociaciones |
| MONDO (identidad) | 22 464 grupos | 9735 | 31 687 `SUBCLASS_OF` | — |
| **Unión proyectada** | | | **279 012** | |

Universo HPO: 19 894 términos vigentes, 19 345 con etiqueta oficial en castellano
(19 932 filas OFFICIAL en babelon). Filas HPOA de aspecto P por base:
OMIM 152 141 · DECIPHER 294 · ORPHA 116 471.

Orphanet product9 (irán a `concept_properties`, no son relaciones): 7032 trastornos con
edad de inicio, 6872 con herencia, 6728 con prevalencia.

## Filtros aplicados a HPO (F3.2)

```json
{
  "stats": {
    "read": 286651,
    "notPhenotypeAspect": 17745,
    "skippedDatabase": 116471,
    "diseaseUnresolved": 844,
    "phenotypeUnresolved": 0,
    "negated": 0,
    "withFrequency": 99820,
    "withRatio": 96237,
    "frequencyProblems": {},
    "onsetWithRange": 2724,
    "onsetWithoutRange": 323,
    "sexResolved": 0,
    "sexUnresolved": 615,
    "tierT2": 104467,
    "tierT3": 47124,
    "referenceCollisions": 6,
    "exactDuplicates": 2,
    "rows": 151589
  },
  "unresolvedDiseases": {
    "no-mondo-group": 844
  }
}
```

## Identidad (F3.1)

Equivalencias leídas: 118 366 axiomas `MONDO:equivalentTo` de mondo.obo + 107 523
`skos:exactMatch` del SSSOM, sobre 32 134 clases MONDO vigentes.

| Grupos | Creados (pivote MONDO del catálogo #688) | Reusados (ficha CIE-10-ES del glosario) | En revisión | Códigos que resuelven | Conflictos |
|---:|---:|---:|---:|---:|---:|
| 22 464 | 20 456 | 1984 | 24 | 62 116 | 21 |

Conflictos por tipo: `group-spans-several-glossary-concepts` 18 · `glossary-concept-in-several-groups` 3. Lista completa
en `volumes.conflicts.json`; **no se resolvieron a mano**.

### Duplicados por etiqueta igual

| Conjunto | Conceptos | Duplicados | Tasa | Entre categorías distintas | Tasa |
|---|---:|---:|---:|---:|---:|
| Glosario actual (cie10es-diagnosticos, cie10es-procedimientos, cima, inlasa-aranceles, medlineplus-es, medlineplus-es-pruebas, wikidata-anatomia, wikidata-relaciones) | 186 968 | 5295 | 2,83 % | 22 | 0,01 % |
| + lo que F3 agrega con etiqueta ES (17 168) | 204 136 | 6109 | 2,99 % | 741 | 0,36 % |

Ejemplos (glosario + F3): «colera» ×2 (disease) · «fiebre tifoidea» ×2 (disease) · «osteomielitis por salmonella» ×2 (disease/signs-symptoms) · «criptosporidiosis» ×2 (disease) · «otras enteritis virales» ×2 (disease) · «otras tuberculosis del sistema nervioso» ×2 (disease) · «peste» ×2 (disease) · «otras formas de leptospirosis» ×2 (disease) · «enfermedad por arañazo de gato» ×2 (disease) · «otras formas de listeriosis» ×2 (disease).
