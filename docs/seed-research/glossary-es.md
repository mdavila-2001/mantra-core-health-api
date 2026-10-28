# Glosario en castellano y enciclopedia — cobertura, licencias y huecos (C9, 2026-10-28)

Hueco → estado hoy → qué se cargó → conteos antes/después. Evidencia: `docs/trabajo/2026-10-27-terminologia-cierre-huecos/evidencia/C9/` (referenciada por número). Todo cargado en un Postgres 16 desechable (`/var/tmp/pg-c9`), **no** en la base del stack.

## Antes / después
| | Antes | Después (Postgres desechable) |
|---|---|---|
| Términos visibles en `glossary-all-terms` | términos curados del seed (64 según el brief; el importador comenta 69; el catálogo tiene 80 entradas con `slug`; no reconciliado) | 28 617 (capa base, 15) · 183 162 con CIE-10-ES completo (19) |
| Con definición | solo curados | 15 439 de 28 617 (10) |
| Con imagen | solo curados | 5 689 de 28 617 (10) |

## Capas cargadas (conteos medidos)
| Capa | Fuente | Términos | Licencia (leída 2026-10-28, ver 25) |
|---|---|---|---|
| cie10es-diagnosticos | Min. Sanidad CIE-10-ES 2026 | 102 131 (12 051 en nivel glosario 3-4 car.) | Aviso legal: reutilización comercial y no comercial citando fuente, sin desnaturalizar |
| cie10es-procedimientos | ídem | 78 948 | ídem |
| cima | AEMPS CIMA (VTM) | 2 381 | Reproducción citando origen y fecha de actualización |
| medlineplus-es / -pruebas | NLM | 1 016 / 302 | Dominio público (resúmenes y pruebas); A.D.A.M. y ASHP excluidos |
| nci-diccionario-cancer-es / genetica-es | NCI | 9 404 / 243 | Sin copyright, citar al NCI |
| wikidata-anatomia | Wikidata (TA98) | 1 905 | CC0; imágenes por archivo |
| wikidata-relaciones | Wikidata | 22 032 aristas, 1 315 fichas creadas | CC0 |
| wikidata-images | Commons | 18 590 filas / 13 591 archivos | por archivo: ver decisiones |

## Huecos con motivo de hoy (re-sondeo 23)
- LOINC en castellano: `loinc.org` 403; requiere cuenta y licencia. Importador sin validar contra archivo real.
- DeCS/BIREME: `decs.bvsalud.org` 200 en portada pero 403 al seguir; exige licencia y token. No cargado.
- INLASA (Bolivia): `inlasa.gob.bo` sin respuesta (000); `minsalud.gob.bo` 200 sin verificar contenido.
- CIE-O-3.2, SNOMED CT, CIE-11: licencia (ver README). No cargados.
- Wikimedia Commons API: 429 con `Retry-After: 5` hoy; no se re-corrieron las imágenes.

## Decisiones del propietario
Imágenes de Commons CC BY-SA/GFDL/ODbL (el filtro las admite; no se auditó cuántas hay: el corpus crudo ya no está); texto de fichas técnicas CIMA (el aviso cubre la web, no se verificó autoría de cada ficha); qué value sets muestra `/glossary` (ver reporte); peso del corpus ES completo (917 MB en base).
