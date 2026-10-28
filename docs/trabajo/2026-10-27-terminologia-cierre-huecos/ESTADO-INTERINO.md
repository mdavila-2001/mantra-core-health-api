# Estado interino — cierre de huecos de terminología (2026-10-28)

AVANCE 10 / 13 carriles entregados con revisión independiente (C1, C2, C3, C4, C6, C7, C8, C9, C10, C11). En curso: C5, C12, C13 y las correcciones de C2/C8. Este documento NO es el REPORTE.md final.

Peldaño máximo alcanzado en todos los carriles: VERIFIED contra Postgres 16 desechable. Nada llegó a REGRESSION_VERIFIED ni se probó contra la base real del stack, la API o la UI.

## Entregados (todos PASS con reservas, sin bloqueantes)
| Carril | Antes → después | Notas |
|---|---|---|
| C1 enfermedades | 184 896 → 194 291 conceptos | Wikidata a medias (429 de WDQS); GARD y CIE-11 ES por flag |
| C3 laboratorio + procedimientos | 12 765 → 81 502 · 1 988 → 84 990 | 109 569 relaciones sin cargar (falta parche del modelo); CUPS CC BY-SA sin cargar |
| C4 alergias | 55 503 → 73 478 | Duda de licencia ChEBI; AllergenOnline/Allergome/COMPARE no abiertas |
| C6 tratamientos por enfermedad | 18 032 → 341 019 afirmaciones | ChEBI/DrugCentral CC BY-SA aislados y retirables; build reproducible no repetido |
| C7 diccionarios | 111 389 → 392 818 conceptos | EMDN/AbreMES con licencia a confirmar; DeCS y FIPAT sin cargar |
| C9 glosario ES | capa base 28 617 visibles; con CIE-10-ES 183 162 | Carga completa solo RUNS (memoria); corpus sin versionar |
| C10 equipos de diagnóstico | 4/15 microtareas (27 %) | GMDN retirado; build completo de master sin memoria suficiente |
| C11 interop-vocab | 16 → 62 956 conceptos | UCUM obra derivada prohibida (decisión); ISO oficial 403 |
| C2 síntomas, C8 enfermería | cerrados en sesión anterior | Correcciones en curso |

## En curso
C5 farmacología clínica (pasada exhaustiva openFDA/CIMA, carga, pack-data) · C12 genética · C13 nutrición y alimentos · correcciones C2/C8 (Omaha/Glasgow/HPO no cargables por defecto, CMDIC, SHA-256 reproducibles, guards).

## Pendiente
Revisión independiente de C5, C12, C13 y de las correcciones · REPORTE.md consolidado · actualizar PLAN.md · limpiar sueltos `271` y `66` en este directorio.

## Huecos transversales (decisión del propietario)
- Sin licencia: SNOMED CT, CPT, MedDRA, DeCS, ATC/DDD OMS, LOINC completo (403), GMDN, CIE-11 (CC BY-ND), NANDA/NIC/NOC.
- CC BY-SA / ODbL: ChEBI, ChEMBL, DrugCentral, CUPS, Open Food Facts, imágenes de Commons.
- Sin acceso: minsalud.gob.bo, datos.gob.mx, FONASA, SIGTAP, ANVISA (401), FIPAT.
- Falta el parche SQL de relaciones: /home/user/mantra-core-health-model no existe en esta máquina.
- Punto abierto: master/lib/manufacturers.mjs:275 fusiona fabricantes por nombre (el brief prohíbe cruces por nombre).
- Peso versionado alto: diagnostic-devices 298 MB; dictionaries/data 94 MB.
