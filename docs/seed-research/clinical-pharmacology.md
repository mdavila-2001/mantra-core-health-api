# Farmacología clínica — registro de pasadas y cobertura

Importador: `tools/terminology-import/clinical-pharmacology/` (fuentes y licencias en su `SOURCES.md`).
Pedido: una monografía por principio activo de uso clínico con clase ATC (5 niveles), mecanismo, farmacocinética,
indicaciones, posología, contraindicaciones, advertencias, interacciones, reacciones adversas con frecuencia, embarazo y
lactancia, sobredosis, formas y vías; todo lo clínico **literal** de una fuente oficial y citado. Evidencia de la corrida:
`docs/trabajo/2026-10-27-terminologia-cierre-huecos/evidencia/C5/` (reporte: `REPORTE-C5.md`).

## Hueco → estado hoy → qué se cargó

| Hueco documentado el 2026-10-24 | Estado hoy (2026-10-28) | Qué se cargó |
|---|---|---|
| «Bloqueado: 403 a CIMA, openFDA, RxNav, EMA, DailyMed, WHOCC, CPIC…» | Re-sondeo con GET: todos responden 200 salvo `api.pharmgkb.org` (502 del túnel). Ya no hay hueco de red | — |
| CIMA fichas técnicas | Descargadas: 25 507 medicamentos, 25 507 detalles, 22 510 fichas segmentadas, 7 358 filas de la maestra ATC | 37 088 secciones (granularidad `route`) / 334 640 (`product`) |
| openFDA drug labels | 14 particiones (1,86 GB, export 2026-10-27, 262 903 etiquetas leídas 262 902 por el autómata; ver «No cubierto») | 46 305 secciones de 2 140 etiquetas de referencia para 2 035 ATC 5 |
| RxNav ATC→RxCUI→UNII | 6 045 ATC 5; 3 634 con RxCUI; 2 656 con puente completo (UNII) | Sólo como propiedad `pharmacology_rxnorm_bridge` (identificadores) |
| EMA | 1 archivo, 2 754 registros, 822 ATC 5 | 959 secciones `therapeutic_indication` (inglés, literal) |
| WHO ATC/DDD, MedDRA, DDInter, PharmGKB/CPIC, EML | Alcanzables pero **sin licencia para cargar** | Nada (decisión del propietario, ver `SOURCES.md`) |

## Pasadas (protocolo de saturación; deduplicación por código, nunca por nombre)

| # | Fecha | Fuentes | Nuevos por causa real | Resultado |
|---|---|---|---|---|
| 0 | 2026-10-24 | LINAME + `vademecum` (repo) | 483 ATC 5 (universo) | Sin texto clínico |
| 1–2 | 2026-10-24 | CIMA, RxNav, openFDA | — | **Bloqueadas (403)**: no cuentan como «0 nuevos» |
| 3 | 2026-10-28 | CIMA completo (`--granularity product`): 25 502 medicamentos, 53 545 pedidos, 0 fallos | 2 236 ATC 5 con producto; 22 505 fichas | Universo final 6 045 ATC 5 (maestra ∪ CIMA ∪ LINAME ∪ vademecum ∪ EMA) |
| 4 | 2026-10-28 | RxNav 6 045 ATC 5 (16 946 pedidos, 0 fallos); openFDA 14 particiones; EMA | 3 634 ATC con RxCUI; 2 035 con etiqueta | — |
| 5 | 2026-10-28 | CIMA re-listado (el vivo informaba 25 507 tras 8 h) | **5 medicamentos nuevos** (nº reg. 91661, 91662, 91663, 91688, 91689), 0 ATC 5 nuevos, 0 retirados | 140 pedidos; los 5 con ficha bajada |
| 6 | 2026-10-28 | CIMA totalFilas vivo = 25 507 = lo bajado; `--plan`: 0 detalles y 0 fichas por bajar. RxNav re-corrida: 0 pedidos (16 946 aciertos de caché). EMA re-descargada: 0 registros nuevos/retirados (idénticas por posición). openFDA: `total_records` 262 903 igual (export_date pasó a 2026-10-28; no se re-descargó, ver «No cubierto») | **0** | Saturado (el cero de la pasada 6 es de contenido, no de red: todos los pedidos respondieron 200) |

## Conteos antes / después

| Medida | Antes | Después |
|---|---:|---:|
| Monografías versionadas en `data/` | 0 | 2 963 |
| Secciones versionadas en `data/` (`route`) | 0 | 84 352 (CIMA 37 088 · openFDA 46 305 · EMA 959) |
| Secciones del corpus exhaustivo (`product`, **no versionado**) | 0 | 381 904 (CIMA 334 640) |
| ATC 5 del universo | 483 | 6 045 |
| ATC 5 con monografía | 0 | 2 963 (2 953 con nombre AEMPS) |
| Cobertura openFDA (ATC con puente completo y con etiqueta) | — | 2 035 de 2 656 (630 sin etiqueta por UNII: hueco real de la fuente) |
| Postgres desechable (corpus `product`): conceptos / designaciones / IS_A / propiedades / `concept_maps`→vademecum | 5 / 3 / 4 / 14 / 1 (ficha de prueba) | 4 052 / 4 044 / 4 038 / 405 290 / 425 |
| 2.ª corrida | — | 0 / 0 / 0 / 0 / 0 filas nuevas, 0 borradas |

Secciones de CIMA sin fecha ni versión (no se publican, no se inventa una): 11 860 en `route`, 54 299 en `product`.

## Cobertura por requisito (corpus `route`, `coverage.md`)

CIMA: 1 531 monografías con alguna sección, 1 506 completas (las 10 requisitos). openFDA: 2 008 con sección, 1 216 completas.
EMA: 822, sólo indicaciones. Detalle y huecos por ATC: `data/coverage.json.gz`.

## Corte propuesto del volumen (decisión del propietario)

El corpus exhaustivo `product` pesa 3,2 GB de NDJSON y **606 MB** en gzip (monografías individuales de hasta 85 MB: lenalidomida L04AX04, rivaroxabán B01AF01…
reúnen las fichas de todos sus medicamentos). Supera el tope de ~300 MB del brief. Se versionó el corpus `route` (una ficha de referencia
por principio activo VTM y vías; todo openFDA y EMA): 462 MB de NDJSON, **81 MB** gzip en 7 partes < 45 MB, `data/SHA256SUMS`.
El `product` se regenera con `fetch-cima.mjs --granularity product` + `build-monographs.mjs --granularity product`
(sha256 del NDJSON `product`: `80cc25a0…2733`, ver `evidencia/C5/monographs-product.sha256`). Alternativa: versionarlo en 2
repos de datos o en un almacén de objetos.

## Fuentes descartadas

Ver `SOURCES.md` («Fuentes evaluadas y no usadas»): comerciales, MedDRA, WHO ATC/DDD, WHO EML/Model Formulary, DDInter, ONC DDI,
PharmGKB/CPIC, AGEMED (reCAPTCHA, no se elude), SNOMED CT.

## No cubierto

- No se re-descargó openFDA tras el cambio de `export_date` (2026-10-27 → 2026-10-28): contenido de etiquetas actualizadas hoy.
- Una etiqueta de las 262 903 declaradas no fue contada por el lector en flujo (262 902 leídas): sin diagnosticar.
- Ningún cruce con el catálogo de productos (`cima/invima/anvisa-medicamentos`) ni con relaciones de otros carriles: `validate-links`
  corrió sin esos datos en la base desechable.
- Carga contra la base real del stack: no hecha (sólo desechable).
- La posología (4.2) es contenido profesional; este code system no debe entrar a value sets del glosario para pacientes sin filtrarla.
