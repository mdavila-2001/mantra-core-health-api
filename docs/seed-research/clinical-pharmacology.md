# Farmacología clínica — registro de pasadas y cobertura

Rama `justin/seed-clinical-pharmacology`. Importador: `tools/terminology-import/clinical-pharmacology/`
(fuentes y licencias en su `SOURCES.md`). Pedido: una monografía por principio activo de uso clínico
con clase ATC (5 niveles), mecanismo, farmacocinética, indicaciones, posología, contraindicaciones,
advertencias, interacciones, reacciones adversas con frecuencia, embarazo y lactancia, sobredosis,
formas y vías; todo lo clínico **literal** de una fuente oficial y citado.

## Saturación (medida el 2026-10-24)

El catálogo **no está saturado** según su protocolo: ninguna de las nueve pasadas con fuente nueva
aportó 0. El aporte en ATC 5 baja de una pasada a otra (105 → 18), pero la regla de cierre pide dos
pasadas seguidas con 0. Lo que queda abierto, y las decisiones que dependen del propietario, están
en el issue 824 (https://github.com/mdavila-2001/mantra-core-health-api/issues/824).

- **Pasada 7 (CIMA exhaustiva):** da 0 ATC 5 nuevos, pero +134 574 secciones de otros titulares.
  `data/` no la incluye: pesa unos 485 MB gz y la granularidad es una decisión del propietario.
- **Fuentes evaluadas sin pasada:** están en la sección del mismo nombre. Ninguna se puede usar sin
  una decisión o sin un parser de PDF validado.

Hosts:

- Desde la tarde del 2026-10-24 (la pasada 2 corrió a las 16:46 UTC) responden `cima.aemps.es`, `rxnav.nlm.nih.gov`, `dailymed.nlm.nih.gov`,
  `www.ema.europa.eu`, `list.essentialmeds.org`, `ftp.ncbi.nlm.nih.gov` y
  `eutils.ncbi.nlm.nih.gov`, además de openFDA.
- No tienen salida `www.minsalud.gob.bo` ni `api.pharmgkb.org`.
- `agemed.gob.bo` y las páginas web de NCBI Bookshelf (`www.ncbi.nlm.nih.gov/books/…`) exigen reCAPTCHA,
  que **no se elude**. Bookshelf se usa por su descarga masiva oficial (`pub/litarch`) y las E-utilities.

Nota técnica: el `fetch` de Node no usa `HTTPS_PROXY` por sí solo; en entornos con proxy hay que
correr los fetchers con `NODE_USE_ENV_PROXY=1` (Node ≥ 22.21).

## Pasadas

Deduplicación siempre por código, nunca por nombre:

- **Monografías:** ATC 5.
- **Secciones:** el trío (ATC 5, clave de sección, sha256 del texto literal).
- **openFDA:** `set_id` y el conjunto exacto de UNII.
- **CIMA:** número de registro.

Cada pasada se mide contra la anterior armada con el **mismo código**, con flags `--no-cima`,
`--no-ema`, `--no-eml`, `--no-dailymed`, `--no-lactmed` y `--no-livertox`. La salida literal de cada
pasada está en la descripción del PR que la incorporó: PR 710 (pasada 1), PR 730 (pasadas 2–5) y
PR 835 (pasadas 6–9).

| # | Hora (UTC) | Fuentes | ATC 5 nuevos con monografía | Secciones nuevas |
|---|---|---|---:|---:|
| 0 | 00:40 | Archivos del repo: LINAME 2022-2024 (482 ATC 5), dataset `vademecum` (483) | 0 | 0 |
| 1 | 15:21 | **openFDA drug labels** (export 2026-10-23, 262 901 etiquetas) + **FDA GSRS** (export 2026-10-21, 167 385 sustancias) como puente UNII ↔ WHO-ATC | **1 033** | **18 853** |
| 2 | 16:46 | **RxNav** (ATC 5 → RxCUI IN/MIN → UNII) para desambiguar el GSRS | **+104** (−7, ver abajo) | **+2 252** |
| 3 | 17:15 | **CIMA** (AEMPS): fichas técnicas por sección, en castellano, una de referencia por (principios, vía); maestra ATC (7 358 códigos, nombres de los 5 niveles) | **+1 432** (neto) | **+46 100** |
| 4 | 17:21 | **EMA**, informe «Medicines output»: indicación de cada medicamento de autorización centralizada, por el ATC que asigna la EMA | **+59** | **+1 401** |
| 5 | 17:48 | **OMS eEML**: indicación (con código CIE-11) y formulaciones de cada recomendación vigente, por el ATC que asigna la OMS | **+88** | **+1 568** |
| 6 | 18:36 | **DailyMed (NLM)**: UNII del SPL para etiquetas que openFDA trae sin bloque armonizado; puntero (sin texto) para las que sólo están en DailyMed | **+51** | **+4 331** |
| 7 | 18:43 | **CIMA exhaustiva** (`--granularity product`): todas las fichas de todos los titulares, sin repetir texto ya publicado para el ATC | **0** | **+134 574** |
| 8 | 18:56 | **LactMed (NICHD/NLM)**: secciones de lactancia, enlazadas por los UNII del registro | **+105** | **+4 586** |
| 9 | 19:05 | **LiverTox (NIDDK/NLM)**: secciones de hepatotoxicidad, enlazadas por CAS → UNII (CAS PRIMARY del GSRS) | **+18** | **+1 836** |

Las pasadas 8 y 9 se midieron sobre la 6, con granularidad por vía: la 7 no entra en `data/`.

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

### Pasada 6 (DailyMed)

- **Identidades bajadas:** 17 729 SPL candidatas, 0 fallos. Son las 589 etiquetas que openFDA no tiene
  y las 17 140 que trae sin UNII.
- **Qué se guarda:** de cada SPL sólo la identidad (UNII de ingredientes ACTI*, vías, versión,
  secciones LOINC), no el XML.
- **Etiquetas de openFDA:** las que no tenían UNII lo toman del SPL, y su **texto sigue siendo el de
  openFDA**. Aportan +48 ATC 5 con texto y +4 331 secciones.
- **Etiquetas que sólo están en DailyMed:** quedan como **puntero sin texto**: 275 punteros en 164
  monografías. Tres ATC 5 (J01DH06, M09AX16, V09IX10) sólo tienen puntero.

### Pasada 7 (CIMA exhaustiva)

- **Fichas:** las 22 506 de todos los titulares, 0 fallos.
- **ATC 5 nuevos:** 0. Todos los principios ya tenían ficha de referencia.
- **Secciones nuevas:** +134 574 con texto distinto, la misma sección con otra redacción de otro
  titular. El dedupe por huella evitó 172 995 repeticiones exactas.
- **Tamaño:** NDJSON de 2,2 GB, unos 485 MB gz. `data/` no lo incluye: la granularidad es una
  decisión del propietario (issue 824).

### Pasada 8 (LactMed)

- **Paquete:** el oficial del archivo de literatura de NCBI (`lactmed_NBK501922.tar.gz`, actualizado
  el 2026-10-22, sha256 en la meta), con 1 976 registros.
- **URL de cada capítulo:** la del accession NBK, obtenido por E-utilities. La web de Bookshelf exige
  reCAPTCHA y no se usa.
- **Enlace por los UNII del registro**, con la misma regla que openFDA:
  - 1 148 registros enlazados.
  - 374 sin UNII, que no se enlazan.
  - El resto, ambiguos o en conflicto: los cuenta `monographs.meta.json` (`lactmed.final`).
- **Secciones:** las de «Drug Levels and Effects», cada una en su fila con clave
  `pregnancy_lactation`.

### Pasada 9 (LiverTox)

- **Registros:** 1 343 del paquete oficial (`livertox_NBK547852.tar.gz`, actualizado el 2026-10-21).
- **Enlace por CAS → UNII:** el CAS PRIMARY del GSRS (agregado a `gsrs-entries`); un CAS de más de una
  sustancia no se resuelve.
  - 663 registros enlazados.
  - 449 sin CAS (fichas de clase) y 44 con un CAS que no resuelve: no se enlazan.
- **Secciones:** sólo las hepáticas («Hepatotoxicity», «Mechanism of Injury», «Outcome and
  Management»), con clave `adverse_reactions`.

## Cobertura medida (tras la pasada 9, granularidad por vía)

Universo ATC 5 conocido: **6 242** (sin cambios desde la pasada 5: las fuentes nuevas enlazan códigos
que ya estaban en el universo). Monografías: **2 883**.

| Nivel ATC | Códigos con monografía (por ruta) | Con nombre ATC oficial (AEMPS) |
|---|---:|---:|
| 1 | 14 | 14 |
| 2 | 92 | 92 |
| 3 | 246 | 246 |
| 4 | 724 | 724 |
| 5 | 2 883 | 2 835 |

Nombre mostrado del ATC 5:

- 2 835 vienen de la AEMPS.
- 29 de la sustancia en el GSRS (EN).
- 3 de la LINAME.
- 16 quedan con el código.

**47 ATC 5 con monografía no figuran en la maestra ATC de la AEMPS.** Vienen del GSRS, la EMA, la eEML
o la LINAME. Pueden ser códigos retirados o tan nuevos que la AEMPS no los publica todavía; no se
corrigen a mano.

Requisitos cubiertos, por fuente. Una monografía es «completa» si una sola fuente cubre los diez:

| Requisito | CIMA (2 158) | openFDA (1 490) | EMA (822) | eEML (509) | LactMed (1 131) | LiverTox (657) |
|---|---:|---:|---:|---:|---:|---:|
| Mecanismo de acción | 2 151 | 1 395 | 0 | 0 | 0 | 0 |
| Farmacocinética | 1 989 | 1 393 | 0 | 0 | 0 | 0 |
| Indicaciones | 2 152 | 1 486 | 822 | 509 | 0 | 0 |
| Posología | 1 836 | 1 488 | 0 | 0 | 0 | 0 |
| Contraindicaciones | 2 156 | 1 393 | 0 | 0 | 0 | 0 |
| Advertencias | 2 152 | 1 457 | 0 | 0 | 0 | 0 |
| Interacciones | 2 154 | 1 089 | 0 | 0 | 0 | 0 |
| Reacciones adversas | 2 155 | 1 398 | 0 | 0 | 0 | 657 |
| Embarazo y lactancia | 1 742 | 1 330 | 0 | 0 | 1 131 | 0 |
| Sobredosis | 2 150 | 1 046 | 0 | 0 | 0 | 0 |
| **Completas** | **1 594** | **891** | 0 | 0 | 0 | 0 |

**Catálogo de productos:** los `medicines-*.ndjson` (CIMA, INVIMA, ANVISA) no están en esta sesión;
el cruce no se midió. Con la base cargada lo mide `validate-links.mjs` (`productCatalog`).

## Huecos

- **LINAME sin monografía: 54 de 482.**
  - Algunos códigos de la LINAME no son ATC vigentes (p. ej. L01XC99, J07BX03): no se corrigen.
  - Otros son productos sin ficha en España ni etiqueta en EE. UU. Lista en
    `data/coverage.json.gz` → `gaps.linameEssentialWithoutMonograph`.
- **Universo sin monografía: 3 359 ATC 5.** Son, en su mayoría, códigos de la maestra ATC sin
  medicamento autorizado en España ni etiqueta enlazable en EE. UU.
- **Etiquetas openFDA que siguen sin enlazar** (de las 26 744 ambiguas del GSRS):

  | Caso | Etiquetas | Motivo |
  |---|---:|---|
  | `ambiguous:rxnav-multiple` | 25 785 | RxNav devuelve varios ATC 5 para el mismo principio |
  | `ambiguous:no-rxnav` | 503 | RxNav no responde con ningún ATC 5 |
  | Conflictos sin desempate | 237 | GSRS y RxNav no coinciden |

  Desde la pasada 6 hay más etiquetas con UNII, el de DailyMed, y por eso también más ambiguas.

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
- **1 193 ATC 5** tienen puente RxNav completo pero ninguna etiqueta de referencia en openFDA.
- **DDD:** no se cargan (WHOCC). **MedDRA:** no se codifica (licencia); las reacciones adversas
  quedan literales, con sus tablas.

## Carga y enlaces verificados

En un Postgres 16 desechable, con el DDL de `database/SQL/00_shared` y `03_terminology` tal cual
(sin la API, sin DDL nuevo, nunca una base viva). Evidencia en
la descripción de los PR 730 y 835.

| Corrida | Conceptos | Designaciones | IS_A | Propiedades | `concept_maps` → vademecum | Borradas | Tiempo |
|---|---:|---:|---:|---:|---:|---:|---:|
| Pasada 1, 1.ª | 1 696 | 969 | 1 682 | 24 137 | 199 | 0 | 9 s |
| Pasada 1, 2.ª | 0 | 0 | 0 | 0 | 0 | 0 | 4 s |
| **Pasada 5, 1.ª** (base nueva) | **3 773** | **3 757** | **3 759** | **90 102** | **425** | 0 | 39 s |
| **Pasada 5, 2.ª** | 0 | 0 | 0 | 0 | 0 | 0 | 19 s |
| Pasada 6, 1.ª (base nueva) | 3 832 | 3 816 | 3 818 | 93 986 | 426 | 0 | 29 s |
| Pasada 6, 2.ª | 0 | 0 | 0 | 0 | 0 | 0 | 17 s |
| **Pasada 9, 1.ª** (base nueva) | **3 959** | **3 943** | **3 945** | **101 033** | **429** | 0 | 32 s |
| **Pasada 9, 2.ª** | 0 | 0 | 0 | 0 | 0 | 0 | 18 s |

- **Tamaño de `concept_properties`, recién cargado:** 342 MB con la pasada 5 y 374 MB con la 9.
- **Integridad del texto:** de las 78 972 secciones de la pasada 9, ninguna tiene un `textSha256`
  distinto del sha256 del texto guardado.
- **Atribuciones:** ninguna fila de la eEML carece de su atribución y su advertencia. Ninguna de
  LactMed ni de LiverTox carece de «Courtesy of the U.S. National Library of Medicine».
- **DailyMed:** ningún puntero lleva texto.
- **`validate-links`:** 429 de los 483 ATC 5 de `vademecum` tienen monografía y su `concept_map`.
- **`drug-treatments`** (ya en `dev`): enlazados por RxCUI o UNII, sin base de datos.
  Llegan a una monografía 3 240 de 4 842 fármacos y 12 657 de 18 032 afirmaciones, que suman 1 465
  ATC 5 distintos.

## Fuentes evaluadas sin pasada

| Fuente | Qué aportaría | Por qué no tiene pasada |
|---|---|---|
| EMA, *product information* (SmPC completa en PDF, también en castellano) | Ficha completa con fecha para los 788 medicamentos centralizados que CIMA publica sin fecha | Es PDF. La extracción literal (cortes de palabra, encabezados) no se validó; hace falta un parser probado contra PDF reales antes de publicar texto clínico |
| NCI Thesaurus (definiciones de agentes, con `FDA_UNII_Code`) | Definición del agente por UNII | Una definición no es una sección de monografía, y forzarla en una clave cambiaría su sentido |
| Health Canada (Drug Product Database / monografías) | Monografías canadienses | Las monografías están en PDF y la licencia de reproducción no se verificó |
| DailyMed, texto de las etiquetas que sólo están ahí | Texto de 275 SPL | Posible copyright de terceros (política de la NLM): sólo puntero |

## Fuentes descartadas

| Fuente | Motivo |
|---|---|
| vademecum.es, PLM, BNF, Martindale, Lexicomp, Medscape | Copyright comercial: sólo para detectar huecos. |
| MedDRA | Licencia por suscripción. |
| WHO ATC/DDD (WHOCC) | Sin redistribución comercial del índice; los nombres ATC de la OMS que trae el GSRS no se copian. |
| DDInter | CC BY-NC-SA 4.0 (no comercial). |
| ONC High-Priority DDI | Sin archivo oficial legible por máquina ni licencia explícita. |
| PharmGKB/ClinPGx | CC BY-SA 4.0 con términos de uso sólo para investigación; `api.pharmgkb.org` sin salida. |
| CPIC | Licencia no confirmada en su página (redirige). |
| AGEMED | reCAPTCHA: no se elude. |
| Formulario Terapéutico Nacional (Bolivia) | `www.minsalud.gob.bo` sin salida. |
| SNOMED CT | Bolivia no es miembro de SNOMED International. |
| PubMed / Europe PMC / Google Scholar | Literatura: descubrir fuentes, no contenido de monografía. |
