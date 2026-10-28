# Reporte C1 — enfermedades (transcrito del informe final del implementador; el agente no pudo escribirlo)

- Commits locales: 1661ae4, eb5bce0, 17ad80b, a06f5b1 · Peldaño: VERIFIED solo contra Postgres 16 desechable (borrado), NO la base real del stack.
- Antes → después (conceptos / designaciones / is-a / alineamientos): 184 896 / 311 525 / 147 963 / 197 374 → 194 291 / 369 606 / 160 381 / 228 021.

## Completado
- MeSH 2026 oficial: 12 490 conceptos (antes 9 320 eran solo claves sin nombre; 763 siguen sin nombre).
- NCIt 26.09d (EVS): 22 854 conceptos + 645 ncit-xref. NANDO 2 777, OncoTree 898, MedlinePlus Genetics 1 305, tablas OMS CIE-10↔11 2026-01.
- node --test 33/33; gzip -t OK; sha256sum -c SHA256SUMS 23 OK; build reproducible (16 partes idénticas en 2 builds); 2.ª carga +0 en 16 sistemas; 0 duplicados, 0 huérfanos, 0 nulos (`evidencia/C1/procedencia-por-sistema.txt`).

## A medias
- Wikidata (CC0): 14 336 ítems de alcance medido; lotes no bajados por 429 de WDQS. Cableado en el build: WRITTEN, sin probar con datos reales. Reanudable con `fetch-wikidata.mjs`.

## Pendiente / decisión del propietario
- GARD (`--with-gard`): sin texto de licencia legible. Títulos CIE-11 ES (`--with-icd11-es`): CC BY-ND. Confirmar si se mantiene la CIE-11 EN ya cargada.
- Por licencia/acceso: OMIM, DeCS (403), CTD, UniProt humdisease, UMLS/MedGen, SNOMED CT, MedDRA, ICD-O-3, CIE-10 con títulos.

## No cubierto
- Base real del stack. Sin revisión independiente todavía.
