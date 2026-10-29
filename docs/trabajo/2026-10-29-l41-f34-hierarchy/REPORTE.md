# TAREA-41 F3.4 — Jerarquía IS_A (MONDO, DOID, CIE-10-ES)

Apilado sobre mantra-core-health-api#1098/#1099 (comparte `f3-identity-inputs.mjs` con el cargador de relaciones, que se refactorizó para no duplicar código).

## Qué hay
- `lib/glossary-es/hierarchy.mjs` (puro): aristas hijo → padre **declaradas por la fuente** y llevadas a los conceptos del glosario con la identidad MONDO de F3.1. `SUBCLASS_OF` de la ficha = `REL_IS_A` existente (F1.1).
  - MONDO y DOID: `parents` del snapshot `diseases/data/` (SHA-256 verificado).
  - CIE-10-ES: el último elemento de `hierarchy` de la ficha, si es otro diagnóstico del glosario (ficha → ficha, sin pasar por la identidad). Capítulos y bloques no son conceptos y no se cargan.
  - **MeSH: no aporta.** Su snapshot son claves de cruce con `parents` vacío en los 9 320 registros; no se deduce de números de árbol. La ficha lo nombra y queda sin cubrir por falta de dato en la fuente.
- `import-f3-hierarchy.mjs`: arma las filas y, con `--load [--dry-run]`, inserta en `concept_relationships` (id determinista, `ON CONFLICT DO NOTHING`, una sola transacción).
- `test/f3-hierarchy.test.mjs`: 8 pruebas con registros reales sin tocar (`fixtures/f3/hierarchy.cut.ndjson`).

## Evidencia (rung 5 — base LOCAL; no VPS)
- Sobre los datos reales: 153 797 aristas leídas → 120 142 filas (CIE-10-ES 99 871 · DOID 13 963 · MONDO 6 308); 25 273 aristas MONDO entre nodos de catálogo ya las cargó `diseases/load-catalog.mjs` y no se repiten.
- Carga local: `--dry-run` PASS; pasada 1 = **22 544** relaciones nuevas; **pasada 2 = 0**. 0 FK sin validar, 0 relaciones con extremo inexistente (`evidencia/load.txt`, `verificacion-db.txt`).
- Ejemplo: A00.0 y A00.1 → A00 «Cólera».
- Tests del importador: ver `evidencia/gates.txt`.

## Límites y notas
- **91 420 aristas no se cargaron** porque sus fichas CIE-10-ES no existen en la base local (hoy 12 051 conceptos de ese sistema frente a ~100 000 fichas del glosario). Se cuentan como `concept-not-in-database`; no se crean conceptos. Al cargar el glosario completo, volver a correr el cargador (es idempotente).
- 6 178 de las 28 722 filas con extremos existentes ya existían con otro id (índice único sobre origen, destino, tipo): se omiten sin duplicar.
- Preexistente, no tocado: una relación de un concepto consigo mismo («3647 Problemas de la sangre», creada el 26/10).
- No se cargó en el VPS.
