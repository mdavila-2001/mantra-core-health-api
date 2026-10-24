# Farmacología clínica — registro de pasadas y cobertura

Rama `justin/seed-clinical-pharmacology`. Importador: `tools/terminology-import/clinical-pharmacology/`
(fuentes y licencias en su `SOURCES.md`). Pedido: una monografía por principio activo de uso clínico
con clase ATC (5 niveles), mecanismo, farmacocinética, indicaciones, posología, contraindicaciones,
advertencias, interacciones, reacciones adversas con frecuencia, embarazo y lactancia, sobredosis,
formas y vías; todo lo clínico **literal** de una fuente oficial y citado.

## Estado (2026-10-24 18:15 UTC): NO saturado — pasadas 6 y 7 en curso

Cinco pasadas con fuentes nuevas, todas con aporte distinto de 0. La regla de cierre («dos pasadas
seguidas con 0 nuevos») **no se cumple todavía**:

- **Pasada 6, DailyMed:** descarga de identidades SPL en curso, 17 729 candidatas.
- **Pasada 7, CIMA exhaustiva:** todas las fichas de todos los titulares, 22 506 fichas, descarga
  en curso.

Hosts:

- Desde la tarde del 2026-10-24 (la pasada 2 corrió a las 16:46 UTC) responden `cima.aemps.es`, `rxnav.nlm.nih.gov`, `dailymed.nlm.nih.gov`,
  `www.ema.europa.eu` y `list.essentialmeds.org`, además de openFDA.
- Siguen sin salida `www.minsalud.gob.bo` y `api.pharmgkb.org`.
- `agemed.gob.bo` responde, pero exige reCAPTCHA, que **no se elude**.

Nota técnica: el `fetch` de Node no usa `HTTPS_PROXY` por sí solo; en entornos con proxy hay que
correr los fetchers con `NODE_USE_ENV_PROXY=1` (Node ≥ 22.21).

## Pasadas

Deduplicación siempre por código, nunca por nombre:

- **Monografías:** ATC 5.
- **Secciones:** el trío (ATC 5, clave de sección, sha256 del texto literal).
- **openFDA:** `set_id` y el conjunto exacto de UNII.
- **CIMA:** número de registro.

Cada pasada se mide contra la anterior armada con el **mismo código**, con flags `--no-cima`,
`--no-ema`, `--no-eml` y `--no-dailymed`. Evidencia literal en
`docs/trabajo/2026-10-24-farmacologia-clinica/evidencia/`.

| # | Hora (UTC) | Fuentes | ATC 5 nuevos con monografía | Secciones nuevas | Evidencia |
|---|---|---|---:|---:|---|
| 0 | 00:40 | Archivos del repo: LINAME 2022-2024 (482 ATC 5), dataset `vademecum` (483) | 0 | 0 | 01 |
| 1 | 15:21 | **openFDA drug labels** (export 2026-10-23, 262 901 etiquetas) + **FDA GSRS** (export 2026-10-21, 167 385 sustancias) como puente UNII ↔ WHO-ATC | **1 033** | **18 853** | 13–14 |
| 2 | 16:46 | **RxNav** (ATC 5 → RxCUI IN/MIN → UNII) para desambiguar el GSRS | **+104** (−7, ver abajo) | **+2 252** | 16 |
| 3 | 17:15 | **CIMA** (AEMPS): fichas técnicas por sección, en castellano, una de referencia por (principios, vía); maestra ATC (7 358 códigos, nombres de los 5 niveles) | **+1 432** (neto) | **+46 100** | 17 |
| 4 | 17:21 | **EMA**, informe «Medicines output»: indicación de cada medicamento de autorización centralizada, por el ATC que asigna la EMA | **+59** | **+1 401** | 18 |
| 5 | 17:48 | **OMS eEML**: indicación (con código CIE-11) y formulaciones de cada recomendación vigente, por el ATC que asigna la OMS | **+88** | **+1 568** | 19–21 |
| 6 | en curso | **DailyMed (NLM)**: UNII del SPL para etiquetas que openFDA trae sin bloque armonizado; puntero (sin texto) para las que sólo están en DailyMed | — | — | — |
| 7 | en curso | **CIMA exhaustiva** (`--granularity product`): todas las fichas, sin repetir texto ya publicado para el ATC | — | — | — |

Re-medición: con el dedupe por huella dentro de cada ATC (`fc68517a`), la pasada 4 queda en
2 621 monografías y **67 499** secciones, 1 107 menos que las 68 606 originales. Son textos de
CIMA idénticos en dos fichas de referencia del mismo ATC; no se pierde ninguno. La pasada 5 se
midió contra esa base.

### Pasada 1 (openFDA + GSRS)

- **Enlace sólo por código.** Los UNII de `openfda.unii` → fracción activa (`ACTIVE MOIETY` del GSRS)
  → códigos WHO-ATC del GSRS. Se enlaza si queda **un** ATC 5 común; si los demás candidatos son de
  las series 50/70 (combinaciones), se toma el < 50. Regla en `lib/gsrs.mjs`.
- **Etiquetas leídas: 262 901.**
  - De uso humano con bloque `openfda`: 82 884.
  - Únicas: 21 570. Por la regla 50/70: 4 267.
  - Ambiguas: 26 744. Sin ATC común: 28 778.
- **Referencia:** una etiqueta por (conjunto exacto de UNII, vía). Dentro de la vía, Rx antes que
  OTC; después, la de `effective_time` más reciente.

### Pasada 2 (RxNav)

- Regla `combineLinks` (`lib/gsrs.mjs`): si el GSRS es ambiguo y RxNav da **un** ATC 5 que está
  entre los candidatos del GSRS, se enlaza.
  - 4 571 etiquetas resueltas así.
  - 95 conflictos GSRS ≠ RxNav: no se enlazan.
- **−7 ATC 5:** L01XC02 (rituximab), L01XC03, L01XC07, L01XC13, L01XE01, L01XE06 y S01XA07.
  - El GSRS trae códigos ATC obsoletos y RxNav, los vigentes (p. ej. L01FA01). El conflicto deja la
    etiqueta sin enlazar.
  - Se recuperan en la pasada 3 con el desempate por los ATC que la AEMPS usa en CIMA.

### Pasada 3 (CIMA)

- **Desempate de conflictos GSRS/RxNav** por los ATC 5 que la AEMPS asigna a medicamentos
  autorizados (`inUse`), sólo por código: 854 etiquetas recuperadas.
- **Fichas sin fecha de versión.** CIMA no publica fecha de revisión en **788 fichas**
  (medicamentos de autorización centralizada de la UE).
  - Sus 11 552 secciones (tras el dedupe) se publican con `versionUnpublished: true` y la nota
    explícita en la cita.
  - La fecha que vale es la de consulta (`lib/cima.mjs#cimaSections`).
- **468 medicamentos de CIMA sin ATC 5:** no se enlazan.
- **Nombres:** los 5 niveles ATC tienen nombre oficial AEMPS en castellano. En nivel 5, 2 668 de
  2 709.

### Pasada 4 (EMA)

- 1 566 medicamentos de uso humano autorizados; 166 sin ATC 5 (no se enlazan).
- **Una fila por medicamento y ATC**, en inglés, con revisión y fecha del EPAR.
- La atribución exigida por el aviso legal de la EMA va en cada fila.

### Pasada 5 (OMS eEML)

- **Recomendaciones:** las 1 132 vigentes de la portada (`statusForIndication: AddedToEml`).
  - 948 con ATC 5, que suman 509 códigos distintos.
  - 184 sin ATC asignado por la OMS (p. ej. codeína): **no se enlazan por nombre**.
- **Dedupe:** 408 secciones repetidas entre recomendaciones del mismo ATC quedan en
  `document.alsoIn`.
- **Fuente vinculante.** La propia eEML advierte que la versión vinculante es el PDF de la EML 2025;
  la advertencia y la atribución CC BY 3.0 IGO van literales en cada fila.
- **ATC 5 nuevos (88):** p. ej. A07EA01, B05AX01–03, G03AC03, J04AD03, J05AR27, J07AF01. En la
  LINAME, los esenciales sin monografía bajan de 75 a 58.

## Cobertura medida (tras la pasada 5)

Universo ATC 5 conocido: **6 242**. Origen de los códigos (uno puede tener varios):

| Origen | ATC 5 |
|---|---:|
| CIMA, maestra ATC | 6 029 |
| GSRS | 4 730 |
| CIMA, medicamentos | 2 237 |
| LINAME | 482 |
| vademecum | 483 |
| sólo EMA | 5 |
| sólo eEML | 6 |

| Nivel ATC | Códigos con monografía (por ruta) | Con nombre ATC oficial (AEMPS) |
|---|---:|---:|
| 1 | 14 | 14 |
| 2 | 92 | 92 |
| 3 | 246 | 246 |
| 4 | 712 | 712 |
| 5 | 2 709 | 2 668 |

Nombre mostrado del ATC 5:

- 2 668 vienen de la AEMPS.
- 22 de la sustancia en el GSRS (EN).
- 3 de la LINAME.
- 16 quedan con el código.

Requisitos cubiertos, por fuente. Una monografía es «completa» si una sola fuente cubre los diez:

| Requisito | CIMA (2 158) | openFDA (1 332) | EMA (822) | eEML (509) |
|---|---:|---:|---:|---:|
| Mecanismo de acción | 2 151 | 1 238 | 0 | 0 |
| Farmacocinética | 1 989 | 1 236 | 0 | 0 |
| Indicaciones | 2 152 | 1 331 | 822 | 509 |
| Posología | 1 836 | 1 332 | 0 | 0 |
| Contraindicaciones | 2 156 | 1 238 | 0 | 0 |
| Advertencias | 2 152 | 1 304 | 0 | 0 |
| Interacciones | 2 154 | 979 | 0 | 0 |
| Reacciones adversas | 2 155 | 1 242 | 0 | 0 |
| Embarazo y lactancia | 1 742 | 1 183 | 0 | 0 |
| Sobredosis | 2 150 | 956 | 0 | 0 |
| **Completas** | **1 594** | **815** | 0 | 0 |

**Catálogo de productos:** los `medicines-*.ndjson` (CIMA, INVIMA, ANVISA) no están en esta sesión;
el cruce no se midió. Con la base cargada lo mide `validate-links.mjs` (`productCatalog`).

## Huecos

- **LINAME sin monografía: 58 de 482.**
  - Algunos códigos de la LINAME no son ATC vigentes (p. ej. L01XC99, J07BX03): no se corrigen.
  - Otros son productos sin ficha en España ni etiqueta en EE. UU. Lista en
    `data/coverage.json.gz` → `gaps.linameEssentialWithoutMonograph`.
- **Universo sin monografía: 3 533 ATC 5.** Son, en su mayoría, códigos de la maestra ATC sin
  medicamento autorizado en España ni etiqueta enlazable en EE. UU.
- **Etiquetas openFDA que siguen sin enlazar** (de las 26 744 ambiguas del GSRS):

  | Caso | Etiquetas | Motivo |
  |---|---:|---|
  | `ambiguous:rxnav-multiple` | 21 954 | RxNav devuelve varios ATC 5 para el mismo principio |
  | `ambiguous:no-rxnav` | 380 | RxNav no responde con ningún ATC 5 |
  | Conflictos sin desempate | 205 | GSRS y RxNav no coinciden |

  Ejemplos de principios con varios ATC 5:

  | Principio | Etiquetas | Candidatos |
  |---|---:|---|
  | alcohol | 2 738 | 3 códigos |
  | ácido salicílico | 1 643 | 4 códigos |
  | lidocaína | 1 123 | 8 códigos |
  | fluoruro | 1 031 | 6 códigos |
  | benzalconio | 991 | 3 códigos |
  | ibuprofeno | 957 | 6 códigos |

  La ATC de la OMS asigna códigos distintos al **mismo** principio según vía o uso. Elegir uno por
  la vía o el nombre sería inferir, así que **no se enlazan**. Es el límite de las fuentes por
  código, no un bloqueo.
- **1 342 ATC 5** tienen puente RxNav completo pero ninguna etiqueta de referencia en openFDA.
- **DDD:** no se cargan (WHOCC). **MedDRA:** no se codifica (licencia); las reacciones adversas
  quedan literales, con sus tablas.

## Carga y enlaces verificados

En un Postgres 16 desechable, con el DDL de `database/SQL/00_shared` y `03_terminology` tal cual
(sin la API, sin DDL nuevo, nunca una base viva). Evidencia en
`docs/trabajo/2026-10-24-farmacologia-clinica/evidencia/21`.

| Corrida | Conceptos | Designaciones | IS_A | Propiedades | `concept_maps` → vademecum | Borradas | Tiempo |
|---|---:|---:|---:|---:|---:|---:|---:|
| Pasada 1, 1.ª | 1 696 | 969 | 1 682 | 24 137 | 199 | 0 | 9 s |
| Pasada 1, 2.ª | 0 | 0 | 0 | 0 | 0 | 0 | 4 s |
| **Pasada 5, 1.ª** (base nueva) | **3 773** | **3 757** | **3 759** | **90 102** | **425** | 0 | 39 s |
| **Pasada 5, 2.ª** | 0 | 0 | 0 | 0 | 0 | 0 | 19 s |

- **Tamaño:** `concept_properties` ocupa 342 MB con el corpus de la pasada 5, recién cargado.
- **Integridad del texto:** de las 69 067 secciones, ninguna tiene un `textSha256` distinto del
  sha256 del texto guardado.
- **Licencia eEML:** ninguna fila de la eEML carece de la atribución o de la advertencia.
- **`validate-links`:** 425 de los 483 ATC 5 de `vademecum` tienen monografía y su `concept_map`.
  Los 58 restantes son los mismos huecos de la LINAME.
- **Ramas hermanas:** `justin/seed-drug-treatments` y `justin/seed-diseases` no existían en `origin`
  al 2026-10-24, así que el enlace con sus datos no se validó.

## Fuentes descartadas

| Fuente | Motivo |
|---|---|
| vademecum.es, PLM, BNF, Martindale, Lexicomp, Medscape | Copyright comercial: sólo para detectar huecos. |
| MedDRA | Licencia por suscripción. |
| WHO ATC/DDD (WHOCC) | Sin redistribución comercial del índice; los nombres ATC de la OMS que trae el GSRS no se copian. |
| DDInter | CC BY-NC-SA 4.0 (no comercial). |
| ONC High-Priority DDI | Sin archivo oficial legible por máquina ni licencia explícita. |
| PharmGKB/ClinPGx | CC BY-SA 4.0 con términos de uso sólo para investigación; `api.pharmgkb.org` sin salida. |
| CPIC | Licencia no confirmada en su página (redirige); decisión del propietario. |
| AGEMED | reCAPTCHA: no se elude. |
| Formulario Terapéutico Nacional (Bolivia) | `www.minsalud.gob.bo` sin salida. |
| SNOMED CT | Bolivia no es miembro de SNOMED International. |
| PubMed / Europe PMC / Google Scholar | Literatura: descubrir fuentes, no contenido de monografía. |
