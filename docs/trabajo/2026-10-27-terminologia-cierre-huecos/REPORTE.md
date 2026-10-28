AVANCE 13 / 13 carriles entregados con revisión independiente (unidad: carril, no microtarea; 7 con partes A MEDIAS declaradas abajo; ninguno pasó de VERIFIED parcial)

# Reporte — Cierre de huecos de terminología (consolidado)

- Fecha: 2026-10-28 · Plan: [PLAN.md](./PLAN.md) · Relevo: [RELEVO.md](./RELEVO.md) · Rama: `claude/adoring-heisenberg-1rl29k` (sin PR)
- Peldaño de evidencia (AGENTS.md §1.1): **VERIFIED, solo contra Postgres 16 desechable** (parsers TESTED). Nada llegó a REGRESSION_VERIFIED: ninguna carga se probó en la base real del stack, ni vía API ni UI. No corresponde decir "listo" ni "cerrado".
- Cómo se trabajó: ≤4 agentes a la vez; cada carril lo revisó un agente distinto del que lo implementó (solo lectura). Todos los veredictos fueron PASS con reservas, sin bloqueantes. Los reportes por carril están en `evidencia/<carril>/REPORTE-*` (varios fueron transcritos por mí porque la herramienta rechazó que el subagente los escribiera).
- Interpretación del pedido: se carga lo que fuentes abiertas con licencia leída permiten; lo demás queda como hueco declarado. Nada se inventó ni tradujo.

## Completado (salida literal en cada reporte de carril)
| Carril | Antes → después | Evidencia clave | Revisión |
|---|---|---|---|
| C1 enfermedades | 184 896 → 194 291 conceptos | tests 33/33, 2.ª carga +0 en 16 sistemas | PASS c/reservas |
| C2 síntomas | (sesión anterior) + correcciones | tests 31/31 | PASS c/reservas |
| C3 laboratorio / procedimientos | 12 765 → 81 502 · 1 988 → 84 990 | tests 45 y 28, 2.ª carga 0 | PASS c/reservas |
| C4 alergias | 55 503 → 73 478 | tests 34/34, 2.ª carga 0 | PASS c/reservas |
| C5 farmacología clínica | 0 → 2 963 monografías (84 352 secciones); ATC 483 → 6 045 | tests 27/27, `route` reproducible | PASS c/reservas |
| C6 tratamientos por enfermedad | 18 032 → 341 019 afirmaciones | tests 27/27, 2.ª carga 0/0/0 | PASS c/reservas |
| C7 diccionarios | 111 389 → 392 818 conceptos | tests 45, 2.ª carga +0 | PASS c/reservas |
| C8 enfermería / especialidades | (sesión anterior) + correcciones | tests 33 y 17, carga 2.ª = 0 | PASS c/reservas |
| C9 glosario ES | capa base 28 617 visibles | tests 167/167, 2.ª carga 0 | PASS c/reservas |
| C10 equipos de diagnóstico | taxonomía 33 616 → 44 726 nodos | tests 24/36/19/24 | PASS c/reservas |
| C11 interop-vocab | 16 → 62 956 conceptos | tests 33/33, 2.ª carga 0 | PASS c/reservas |
| C12 genética | 0 → 346 171 conceptos | tests 41/41, 2.ª carga 0 | PASS c/reservas |
| C13 nutrición y alimentos | 9 → 2 059 819 conceptos | tests 18/18, 2.ª carga +0 | PASS c/reservas |

Correcciones del relevo (C2/C8): casi todo ya estaba aplicado; se corrigieron docs de CMDIC, `data/` de specialty-services y guards de `fresh-db.sh` (los 6 del repo tienen ya guard host local + base `*_test`, incluido `dictionaries/`, corregido en 684f2e6).

## A medias
- **C1**: Wikidata (≈14 336 ítems) sin bajar por 429 de WDQS; cableado WRITTEN. Falta: reanudar `fetch-wikidata.mjs`.
- **C3**: 109 569 relaciones de procedimientos escritas y TESTED, no cargadas (falta el parche del modelo, `/home/user/mantra-core-health-model` no existe aquí). CUPS/México/SUS sin cargar.
- **C5**: corpus `product` (606 MB gzip) sin alojar; solo `route` versionado. Falta decisión de alojamiento.
- **C6**: build reproducible no repetido (4/5); enlaces contra catálogos reales no medidos (`validate-links` dio 0 enlaces: no es cobertura).
- **C9**: carga completa (183 162 visibles) solo RUNS por memoria; corpus no versionado ni con SHA256SUMS.
- **C10**: 4/15 microtareas (27 %); build completo de `master` sin memoria suficiente con 2 500 MB; fabricantes/modelos del 24/10.
- **C12/C7**: condición de carrera sobre `is_default` de HGNC/SO (ver riesgos).

## Pendiente
| Qué | Qué lo destraba |
|---|---|
| Relaciones con evidencia (C3, C12) | Parche SQL del modelo en esta máquina |
| Wikidata enfermedades | Reintento con backoff largo (Retry-After ≈ 1 000 s) |
| Carga a la base real y prueba por API/UI | Autorización del propietario; es lo que lleva a REGRESSION_VERIFIED |
| Dominios no lanzados: ICD-9-CM y clasificaciones CMS/NCHS de dominio público, UNII/GSRS y listas SPL, microbiología/antimicrobianos | Lanzar carriles nuevos |
| Lectores de UK CoFID, AFCD, EFSA FoodEx2, FAO/INFOODS, LanguaL | Leer licencia y escribir lector |

## No cubierto
Base real del stack, API y UI en todos los carriles · expansión de value sets contra un servidor de referencia (C11) · re-descarga de openFDA tras `export_date` 2026-10-28 (C5) · integridad SQL no reejecutada por los revisores (confían en la evidencia del implementador) · auditoría campo a campo del texto verbatim.

## Desvíos del plan
- 13 carriles en lugar de 8; C1–C13 con rutas disjuntas. Se pasó de 13 agentes simultáneos a ≤4.
- Reportes de C1, C5, C7, C11, C12, C13 transcritos por mí del informe del subagente (la herramienta Write se los rechazó).
- Dos errores míos al transcribir (tiempo de carga de C7, errata en C13) corregidos en 8a0b6f3 y 5befe12.

## Riesgos residuales
- `dictionaries/load-dictionaries.mjs:171` inserta `is_default=true` sin condición; genética lo pone solo si no hay otro. Si genética corre primero en base limpia quedan dos default de HGNC/SO. Sin prueba de ese orden.
- `master/lib/manufacturers.mjs:275` (C10) fusiona fabricantes sin identificador legal por nombre: choca con la regla de no cruzar por parecido de nombre; no analizado.
- Los cargadores apuntan por defecto a `mantra_redesa_health`:5433; solo algunos exigen `_test`. Correr siempre con `DB_*` explícito. Guards pendientes: `eu/load.mjs`, `us/load-dx-device-types-us.mjs`, `load-clinical-pharmacology.mjs`, `load-glossary-es.mjs` y otros.
- Peso versionado: diagnostic-devices 298 MB, dictionaries 94 MB, nutrition-foods 100 MB, clinical-pharmacology 81 MB; +60 MB de blobs regenerados en C7. Archivos `hc-mdall` de 47,1 MB decimales (límite 45 MB si es decimal).
- Procedencia por fila incompleta en algunos corpus (C1: SHA-256 y licencia solo a nivel de fuente; C7 Wikidata ES; C13 con id corto de licencia).
- `node --test` sin filtro falla en C1/C5/C7 por scripts de semilla recogidos por el glob; los números "N/N" valen solo con el comando exacto de cada reporte.
- Duplicado de CVX/MVX entre `allergies/` e `interop-vocab/`; ICD-10-PCS FY2026 y FY2027 coexisten en `lab-tests`.

## Decisiones y ambigüedades (para el propietario)
**Licencias a decidir:** ChEBI (LICENSE CC BY 4.0 vs README CC BY-SA 4.0), ChEMBL y DrugCentral (CC BY-SA, cargados en code systems retirables), CUPS Colombia (CC BY-SA, no cargado), Open Food Facts (ODbL), imágenes de Commons CC BY-SA/GFDL/ODbL, "Procedimiento del PBS" CC BY-SA 4.0, EMDN (CC BY 4.0 inferida del aviso general), AbreMES-DB (CC BY 4.0, no MIT como decía el pedido; piso de frecuencia ≥3 es criterio del implementador), UCUM (prohíbe obras derivadas; cargado verbatim con aviso), CVX/MVX (dominio público inferido; CDC dio 403), MED-RT (sin aviso; "a confirmar"), CIE-11 EN (CC BY-ND, ya cargada por precedente), HPO (cláusula no comercial), Omaha / Glasgow (detrás de flag), CDNO y FOBI (archivo y registro discrepan), GARD (sin texto de licencia), ANVISA (decreto 8.777/2016 como licencia abierta), CDSCO, identificadores `DRUGBANK` (~243 000, solo ids, de PharmacotherapyDB/DrugCentral), atribuciones obligatorias (CC BY, OGL-Canadá, eEML).
**Sin licencia, no cargados:** SNOMED CT, CPT, MedDRA, DeCS, ATC/DDD OMS (solo códigos exactos), LOINC completo (403), GMDN, NANDA/NIC/NOC, Braden/Barthel/Waterlow/MUST, ISO oficial, SIX/SIL/UN M49, OMIM/COSMIC.
**Producto:** `/glossary` no tiene tope de 64; el límite es de datos (solo los curados son miembros del value set) → cargar a la base real ya mostraría lo importado; diff opcional en `evidencia/C9/REPORTE-C9.md`, no aplicado. Qué value sets entran al paraguas `glossary-all-terms`; si se muestran conceptos en inglés; 181 079 filas CIE-10-ES sin definición ni imagen.
**Modelo (propuestas sin DDL):** conceptos de idioma pt/ja/it/de/nl/fr/pl/ru/zh; mejor guardado de relación y versión en `concept_maps`; `replaced_by_concept_id`; `concept_map` allergy-foodon ↔ foodon; `REL_SYMPTOM_EXCLUDED` ausente en `concepts.ts`; especialidades faltantes (Neurocirugía 266, Cirugía Plástica, Cardiovascular/Tórax, Medicina Nuclear/Radioterapia, Mastología) y profesión vs especialidad.
**Corte de peso:** `--no-branded` en C13 (59 421 conceptos, ~12 MB); no versionar `hc-mdall` (~93 MB) en C10; dónde alojar `product` de C5 (606 MB).
**Versión predeterminada** de HGNC y Sequence Ontology (C7 vs C12); retirar capa ICD-10-PCS FY2026 de lab-tests; `type_of_gene=biological-region` (128 261 genes) en C12.
**Interpretaciones asumidas:** "exhaustivo" en C5 = fichas CIMA + etiqueta openFDA de referencia por ATC (no las 262 903); Branded sin ingredientes ni nutrientes (C13).
**Alerta:** `cenetec-difusion.com` sirve hoy una página de casinos (del relevo, no reverificada).
