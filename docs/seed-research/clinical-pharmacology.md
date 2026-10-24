# Farmacología clínica — registro de pasadas y cobertura

Rama `justin/seed-clinical-pharmacology`. Importador: `tools/terminology-import/clinical-pharmacology/`
(fuentes y licencias en su `SOURCES.md`). Pedido: una monografía por principio activo de uso clínico
con clase ATC (5 niveles), mecanismo, farmacocinética, indicaciones, posología, contraindicaciones,
advertencias, interacciones, reacciones adversas con frecuencia, embarazo y lactancia, sobredosis,
formas y vías; todo lo clínico **literal** de una fuente oficial y citado.

## Estado (2026-10-24 15:30 UTC): NO saturado — sólo openFDA alcanzable

La primera sesión (00:30 UTC) no tenía salida a ninguna fuente. Tras habilitar la red, a las
15:10 UTC respondían **sólo** `api.fda.gov` y `download.open.fda.gov`; siguen en **403**
`cima.aemps.es`, `rxnav.nlm.nih.gov`, `dailymed.nlm.nih.gov`, `open.fda.gov`, `www.ema.europa.eu`,
`www.whocc.no`, `list.essentialmeds.org`, `www.wikidata.org`, `gsrs.ncats.nih.gov`,
`www.minsalud.gob.bo`, `api.cpicpgx.org`, `www.ebi.ac.uk` y `eutils.ncbi.nlm.nih.gov`.

Con eso se corrió la **pasada 1 (openFDA + GSRS)**. Las demás fuentes siguen bloqueadas, así que
la regla de «dos pasadas seguidas con 0» **no se puede cumplir**: un 403 no es un cero. Los
bloqueos se registran como bloqueos.

Nota técnica: el `fetch` de Node no usa `HTTPS_PROXY` por sí solo; en entornos con proxy hay que
correr los fetchers con `NODE_USE_ENV_PROXY=1` (Node ≥ 22.21).

## Pasadas

Deduplicación siempre por código (ATC 5; en openFDA, `set_id` y conjunto exacto de UNII; en CIMA,
nº de registro), nunca por nombre.

| # | Fecha (UTC) | Fuentes | ATC 5 nuevos con monografía | Secciones nuevas | Resultado |
|---|---|---|---:|---:|---|
| 0 | 2026-10-24 00:40 | Archivos del repo: LINAME 2022-2024 (482 ATC 5), dataset `vademecum` (483) | 0 | 0 | Universo inicial de 483 ATC 5. Sin texto clínico. |
| 1 | 2026-10-24 15:21 | **openFDA drug labels** (export 2026-10-23, 14 particiones, 262 901 etiquetas) + **FDA GSRS** (export 2026-10-21, 167 385 sustancias) como puente UNII ↔ WHO-ATC | **1 033** | **18 853** | Ver abajo. Idioma de origen: inglés. |
| — | 2026-10-24 | CIMA (AEMPS) | — | — | **Bloqueada (403).** |
| — | 2026-10-24 | RxNav (puente ATC → RxCUI → UNII) | — | — | **Bloqueada (403).** Es el puente que resolvería las etiquetas ambiguas (ver «Huecos»). |
| — | 2026-10-24 | DailyMed, EMA, FTN Bolivia, WHO EML, CPIC | — | — | **Bloqueadas (403).** |

### Pasada 1 en detalle (openFDA + GSRS)

- **Enlace sólo por código.** Para cada etiqueta, los UNII de `openfda.unii` → fracción activa
  (relación `ACTIVE MOIETY` del GSRS) → códigos WHO-ATC del GSRS.
  - Se enlaza si queda **un** ATC 5 que listan todas las fracciones y que no lista ningún otro
    principio.
  - Si es un solo principio y los demás candidatos son de las series 50/70 (combinaciones según la
    ATC de la OMS), se toma el de número < 50.
  - Detalle de la regla en `lib/gsrs.mjs`.
- **Etiquetas leídas: 262 901.**
  - De uso humano (Rx u OTC) con bloque `openfda`: 82 884. Sin UNII: 1 522.
  - Enlazadas por regla única: 21 570. Por la regla de series 50/70: 4 267.
  - Ambiguas: 26 744. Sin ATC común: 28 778. UNII desconocido para el GSRS: 3.
- **Referencia: 1 408 etiquetas para 1 047 ATC 5.** Hay una por (conjunto exacto de UNII, vías).
  Dentro de cada vía se prefiere la de prescripción; sin ella, OTC. Después, la de
  `effective_time` más reciente.
- **Resultado: 1 033 monografías y 18 853 secciones.** De las referencias, 34 no traían ningún
  campo mapeado.
- **El nombre mostrado no es un nombre ATC:**
  - 198 monografías usan el de la LINAME (castellano).
  - 771 usan el de la sustancia en el GSRS (inglés, designación EN).
  - 64 quedan con el código, porque son combinaciones y no se compone un nombre.
  - Los nombres ATC de la OMS que trae el GSRS **no se copian**.

## Cobertura medida (pasada 1)

Universo ATC 5 conocido: **4 775**. Origen de los códigos (un código puede tener varios):

| Origen | ATC 5 |
|---|---:|
| GSRS | 4 730 |
| Enlazados desde openFDA | 834 |
| LINAME | 482 |
| vademecum | 483 |

| Nivel ATC | Códigos con monografía (por ruta) | Con nombre ATC oficial (AEMPS) |
|---|---:|---:|
| 1 | 14 | 0 |
| 2 | 82 | 0 |
| 3 | 171 | 0 |
| 4 | 396 | 0 |
| 5 | 1 033 | 0 |

Los nombres ATC oficiales en castellano vienen de CIMA (bloqueada).

openFDA: 1 033 monografías con secciones; 678 **completas** (los 10 requisitos) y 355 incompletas.

| Requisito | Monografías que lo cubren |
|---|---:|
| Mecanismo de acción | 949 |
| Farmacocinética | 947 |
| Indicaciones | 1 033 |
| Posología | 1 033 |
| Contraindicaciones | 950 |
| Advertencias | 1 014 |
| Interacciones | 767 |
| Reacciones adversas | 953 |
| Embarazo y lactancia | 900 |
| Sobredosis | 792 |

**Catálogo de productos:** los `medicines-*.ndjson` (CIMA, INVIMA, ANVISA) no están en esta sesión;
el cruce no se midió. Con la base cargada lo mide `validate-links.mjs` (`productCatalog`).

## Huecos

- **LINAME (esenciales de Bolivia) sin monografía: 284 de 482.** Muchos son principios cuyo ATC
  depende de la vía (ver abajo) o productos sin etiqueta en EE. UU.
- **Universo sin monografía: 3 742 ATC 5.**
- **Etiquetas ambiguas: 26 744.** La ATC de la OMS asigna códigos distintos al mismo principio
  según vía o uso, y por código no se puede elegir. También hay combinaciones que el GSRS anota en
  un solo principio. Las más frecuentes (etiquetas):

  | Principio | Etiquetas | Candidatos |
  |---|---:|---|
  | alcohol | 2 738 | D08AX08, V03AB16, V03AZ01 |
  | ácido salicílico | 1 643 | 4 códigos (D01AE12, N02BA03, N02BA04, S01BC08) |
  | lidocaína | 1 123 | 8 códigos |
  | fluoruro | 1 031 | 6 códigos |
  | benzalconio | 991 | D08AJ01, D09AA11, R02AA16 |
  | ibuprofeno | 957 | 6 códigos |
  | difenhidramina | 693 | D04AA32, R06AA02, R06AA52 |
  | calcio | 566 | 19 códigos |
  | hidrocortisona | 523 | 19 códigos |
  | diclofenaco | 405 | 6 códigos |
  | ácido acetilsalicílico | 382 | 11 códigos |

  Por la combinación que el GSRS anota en un solo principio quedan, por ejemplo, amoxicilina
  (J01CA04 / J01CR02) y enalapril (C09AA02 / C09BA02).

  Las resolverían **RxNav** (ATC 5 → ingrediente → UNII: el código ATC 5 elige el ingrediente) **o
  CIMA** (ATC por producto). No se resuelve por nombre ni por vía.
- **Sin texto en castellano:** CIMA bloqueada.
- **DDD:** no se cargan (WHOCC).
- **MedDRA:** no se codifica (licencia). Las reacciones adversas quedan literales, con sus tablas.

## Carga y enlaces verificados

En un Postgres 16 desechable, con el DDL de `database/SQL/00_shared` y `03_terminology` tal cual
(sin la API, sin DDL nuevo). La salida de `validate-links.mjs` y el plan en seco quedan en
`tools/terminology-import/clinical-pharmacology/data/` (`validate-links.json.gz`, `load-plan.dry-run.json.gz`).

| Corrida | Conceptos | Designaciones | IS_A | Propiedades | `concept_maps` → vademecum | Borradas | Tiempo |
|---|---:|---:|---:|---:|---:|---:|---:|
| 1.ª (corpus completo) | 1 696 | 969 | 1 682 | 24 137 | 199 | 0 | 9 s |
| 2.ª (misma fuente) | 0 | 0 | 0 | 0 | 0 | 0 | 4 s |
| Tras agregar el aviso de openFDA a cada sección | 0 | 0 | 0 | 18 853 | 0 | 18 853 | — |
| Otra vez | 0 | 0 | 0 | 0 | 0 | 0 | — |

- **Tamaño:** `concept_properties` ocupa 71 MB recién cargado. Llega a 146 MB después del
  reemplazo, por las tuplas muertas sin `VACUUM`.
- **`validate-links`:** 199 de los 483 ATC 5 de `vademecum` tienen monografía y su `concept_map`.
- **Ramas hermanas:** `justin/seed-drug-treatments` y `justin/seed-diseases` no existían en `origin`
  al 2026-10-24, así que el enlace con sus datos no se validó. `validate-links.mjs` revisa por código
  cualquier relación cuyo extremo sea un ATC 5.

## Fuentes descartadas

| Fuente | Motivo |
|---|---|
| vademecum.es, PLM, BNF, Martindale, Lexicomp, Medscape | Copyright comercial: sólo para detectar huecos. |
| MedDRA | Licencia por suscripción. |
| WHO ATC/DDD (WHOCC) | Sin redistribución comercial del índice; los nombres ATC de la OMS que trae el GSRS no se copian. |
| WHO Model Formulary / EML | © OMS / CC BY-NC-SA 3.0 IGO (no comercial): decisión del propietario. |
| DDInter, ONC High-Priority DDI | Licencia no verificada / sin archivo oficial. |
| PharmGKB/ClinPGx, CPIC | CC BY-SA 4.0 / por confirmar; farmacogenómica sólo desde la etiqueta FDA (18 secciones). |
| AGEMED | reCAPTCHA: no se elude. |
| SNOMED CT | Bolivia no es miembro de SNOMED International. |
| PubMed / Europe PMC / Google Scholar | Literatura: descubrir fuentes, no contenido de monografía. |
