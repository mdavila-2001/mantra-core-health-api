# Farmacología clínica — registro de pasadas y cobertura

Rama `justin/seed-clinical-pharmacology`. Importador: `tools/terminology-import/clinical-pharmacology/`
(fuentes y licencias en su `SOURCES.md`). Pedido: una monografía por principio activo de uso clínico
con clase ATC (5 niveles), mecanismo, farmacocinética, indicaciones, posología, contraindicaciones,
advertencias, interacciones, reacciones adversas con frecuencia, embarazo y lactancia, sobredosis,
formas y vías; todo lo clínico **literal** de una fuente oficial y citado.

## Saturación (medida el 2026-10-30): no alcanzada

El catálogo **no está saturado**. Ninguna de las diez pasadas con fuente nueva aportó 0, y la regla de
cierre pide dos pasadas seguidas con 0 ATC 5 **y** 0 secciones nuevas.

- **Pasada 10:** información de producto de la EMA en PDF. Con el extractor verificado aporta 0 ATC 5 y
  +3 671 secciones en castellano de medicamentos que no están en CIMA (ver «Pasada 10»).
- **Fuentes libres y oficiales que quedan:** todas bloqueadas o fuera de licencia; detalle en
  «Fuentes evaluadas sin pasada» y «Fuentes descartadas». Prueba del 2026-10-30:
  - `www.minsalud.gob.bo` (Formulario Terapéutico Nacional): `curl: (52) Empty reply from server`.
  - `api.pharmgkb.org`: «gateway answered 502 to CONNECT (policy denial or upstream failure)».
  - `agemed.gob.bo`: responde, pero exige reCAPTCHA, que no se elude.

El estado está en el issue 824 (https://github.com/mdavila-2001/mantra-core-health-api/issues/824). Las
cuatro decisiones del propietario están tomadas y se aplican como dice «Decisiones del propietario».

Hosts:

- Desde la tarde del 2026-10-24 (la pasada 2 corrió a las 16:46 UTC) responden `cima.aemps.es`, `rxnav.nlm.nih.gov`, `dailymed.nlm.nih.gov`,
  `www.ema.europa.eu`, `list.essentialmeds.org`, `ftp.ncbi.nlm.nih.gov` y
  `eutils.ncbi.nlm.nih.gov`, además de openFDA.
- No tienen salida `www.minsalud.gob.bo` ni `api.pharmgkb.org`.
- `agemed.gob.bo` y las páginas web de NCBI Bookshelf (`www.ncbi.nlm.nih.gov/books/…`) exigen reCAPTCHA,
  que **no se elude**. Bookshelf se usa por su descarga masiva oficial (`pub/litarch`) y las E-utilities.

Nota técnica: el `fetch` de Node no usa `HTTPS_PROXY` por sí solo; en entornos con proxy hay que
correr los fetchers con `NODE_USE_ENV_PROXY=1` (Node ≥ 22.21).

## Decisiones del propietario

Tomadas el 2026-10-26 (issue 824). Cada una la hace cumplir el código y la cubre una prueba
(`tools/terminology-import/clinical-pharmacology/test/decisiones-824.test.mjs`; la lectura, los specs de
`src/modules/terminology`).

### 1. Posología solo para el personal clínico

- **Audiencia.** Toda sección, la posología incluida, lleva `audience: 'professional'` en su
  `value_json`. Los normalizadores de cada fuente la escriben; `assertSection` (armado) y
  `loadableMonograph` (carga) rechazan cualquier sección sin ella.
- **Corpus de `data/`.** Sus 78 972 secciones, y las 4 270 de posología, son `professional`.
- **Fuera del glosario.** El code system no es miembro de ningún value set del glosario, y el corte S3
  (sin posología para pacientes) sigue vigente.
- **Lectura.** `GET /terminology/CodeSystem/$lookup` y `GET /terminology/concepts/:conceptId` omiten las
  filas `professional` salvo que el sujeto tenga un rol clínico (los asistenciales del catálogo de
  actores, o `SUPERADMIN`). Un `PATIENT`, un `USER` o un `SECURITY_ADMIN` no las ven, y sin sujeto no se
  entrega ninguna. La regla está en `src/modules/terminology/pharmacology-audience.ts`.
- **Esquema.** No hay columna de visibilidad: la audiencia vive dentro de `value_json`, que es lo que
  la API filtra.

### 2. Solo por principio activo en `data/`

- **Qué se versiona.** Monografías por (principio activo, vías), `--granularity route`.
- **El corpus por producto** (`--granularity product`, ~2,2 GB, ~485 MB gz) no se versiona:
  `build-monographs.mjs` lo escribe en `out/product/` (junto a `glossary-data-build/`, fuera del repo),
  `pack-data.mjs` solo empaqueta una lista cerrada (`monographs`, `gsrs-entries`) y aborta si el meta de
  `out/` no es de granularidad `route`, y `.gitignore` cierra `data/*product*` y `out/`.
- **Tampoco se carga:** el cargador lee `out/monographs.ndjson`.
- **`fetch-cima.mjs --granularity product`** sigue bajando las fichas a la caché (fuera de git).

### 3. eEML: solo referencias

- **Qué se guarda.** Por cada recomendación vigente con ATC 5: id, URL, URL del JSON-LD, fecha de la
  decisión, ATC 5 de la OMS, ids de los medicamentos, código CIE-11 con su URI y los rótulos `list` e
  `includedInEmlc`. Va en `pharmacology_external_documents`, igual que los SPL de DailyMed cuyo texto no
  se redistribuye, con la licencia (`CC BY 3.0 IGO`) y su enlace.
- **Qué no.** Indicación, descripción, formulaciones, rótulo de la sección de la lista ni nombres de
  medicamentos. `emlRecommendation` ya no los extrae, y no existen filas de sección de la eEML.
- **Por qué.** La licencia excluye el uso «in conjunction with the advertising or promotion of commercial
  products» y no está confirmado con la OMS que esta aplicación quede fuera de ese supuesto.
- **`data/` (desde el 2026-10-30):** los `monographs.part-*` se regeneraron con este código y no
  traen filas de texto de la eEML (0), sólo sus 988 referencias en 509 monografías. Si se carga un
  corpus anterior, `loadableMonograph` convierte sus filas de la eEML en esas referencias.

### 4. Fichas de CIMA sin fecha: se cargan marcadas

- **Marca.** Una ficha que CIMA publica sin fecha (autorización centralizada de la UE) entra con
  `document.versionUnpublished: true`, `versionNote` y, en la cita, «sin fecha de versión publicada por
  CIMA». Vale la fecha de consulta (`retrievedAt`).
- **Admisión.** `hasVersion` la admite con la marca y la fecha de consulta; sin ninguna de las dos, la
  sección no se publica.
- **Medido en `data/`:** 11 552 secciones de 738 fichas llevan la marca.
- **Lectura.** `$lookup` agrega a cada sección `sourceAge`: `{ known, sourceDate?, retrievedAt }`.
  `known: false` es la antigüedad desconocida que el front muestra en su estado S7; `sourceDate` es la
  fecha de la fuente cuando se conoce. El valor de la sección llega entero.

## Pasadas

Deduplicación siempre por código, nunca por nombre:

- **Monografías:** ATC 5.
- **Secciones:** el trío (ATC 5, clave de sección, sha256 del texto literal).
- **openFDA:** `set_id` y el conjunto exacto de UNII.
- **CIMA:** número de registro.

Cada pasada se mide contra la anterior armada con el **mismo código**, con flags `--no-cima`,
`--no-ema`, `--no-eml`, `--no-dailymed`, `--no-lactmed`, `--no-livertox` y `--no-ema-pi`. La salida
literal de cada pasada está en la descripción del PR que la incorporó: PR 710 (pasada 1), PR 730
(pasadas 2–5), PR 835 (pasadas 6–9) y el PR de la pasada 10.

| # | Hora (UTC) | Fuentes | ATC 5 nuevos con monografía | Secciones nuevas |
|---|---|---|---:|---:|
| 0 | 00:40 | Archivos del repo: LINAME 2022-2024 (482 ATC 5), dataset `vademecum` (483) | 0 | 0 |
| 1 | 15:21 | **openFDA drug labels** (export 2026-10-23, 262 901 etiquetas) + **FDA GSRS** (export 2026-10-21, 167 385 sustancias) como puente UNII ↔ WHO-ATC | **1 033** | **18 853** |
| 2 | 16:46 | **RxNav** (ATC 5 → RxCUI IN/MIN → UNII) para desambiguar el GSRS | **+104** (−7, ver abajo) | **+2 252** |
| 3 | 17:15 | **CIMA** (AEMPS): fichas técnicas por sección, en castellano, una de referencia por (principios, vía); maestra ATC (7 358 códigos, nombres de los 5 niveles) | **+1 432** (neto) | **+46 100** |
| 4 | 17:21 | **EMA**, informe «Medicines output»: indicación de cada medicamento de autorización centralizada, por el ATC que asigna la EMA | **+59** | **+1 401** |
| 5 | 17:48 | **OMS eEML**: cada recomendación vigente, por el ATC que asigna la OMS. Medida cuando aportaba texto (indicación con CIE-11 y formulaciones); hoy son referencias, sin secciones | **+88** | **+1 568** |
| 6 | 18:36 | **DailyMed (NLM)**: UNII del SPL para etiquetas que openFDA trae sin bloque armonizado; puntero (sin texto) para las que sólo están en DailyMed | **+51** | **+4 331** |
| 7 | 18:43 | **CIMA exhaustiva** (`--granularity product`): todas las fichas de todos los titulares, sin repetir texto ya publicado para el ATC. Corpus aparte, fuera de `data/` | **0** | **+134 574** |
| 8 | 18:56 | **LactMed (NICHD/NLM)**: secciones de lactancia, enlazadas por los UNII del registro | **+105** | **+4 586** |
| 9 | 19:05 | **LiverTox (NIDDK/NLM)**: secciones de hepatotoxicidad, enlazadas por CAS → UNII (CAS PRIMARY del GSRS) | **+18** | **+1 836** |
| 10 | 30-10 | **EMA, información de producto** (PDF en castellano, 1 397 medicamentos), por el ATC que asigna la EMA. Texto sólo de las secciones de extracción verificada; el resto, puntero al PDF oficial | **0** | **+3 671** |

Las pasadas 8 y 9 se midieron sobre la 6, con granularidad por vía: la 7 no entra en `data/`. Las horas
son del 2026-10-24 salvo la pasada 10.

**Re-medición contra `dev` (2026-10-30).** Armado por vía con el código de `dev` (`61620b2a`) y comparado
con su `data/`: 0 ATC 5 nuevos, 0 perdidos y 0 secciones nuevas. Las pasadas 6 y 7 ya estaban en `dev`
(la 7 fuera de `data/`, por decisión). La única diferencia son las 1 568 secciones con texto de la eEML,
que pasan a 988 referencias.

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
  - Se cargan marcadas: sus 11 552 secciones en el corpus por vía (738 fichas) llevan
    `versionUnpublished: true` y la nota explícita en la cita.
  - La fecha que vale es la de consulta (`lib/cima.mjs#cimaSections`); ver «Decisiones del propietario».
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
- **Solo referencias.** Cada recomendación con ATC 5 es una referencia (ids y enlaces) en la monografía
  de cada uno de sus ATC 5; ver «Decisiones del propietario», punto 3. No hay filas de sección ni dedupe
  por huella.
- **Medida con texto.** La pasada se midió cuando la eEML aportaba su indicación y sus formulaciones:
  88 ATC 5 nuevos (p. ej. A07EA01, B05AX01–03, G03AC03, J04AD03, J05AR27, J07AF01), y en la LINAME los
  esenciales sin monografía bajaban de 75 a 58. Con referencias, esos ATC 5 conservan su monografía,
  sin secciones de la eEML.

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
- **Tamaño:** NDJSON de 2,2 GB, unos 485 MB gz. `data/` no lo incluye y el armado lo escribe en
  `out/product/` (ver «Decisiones del propietario», punto 2).

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

### Pasada 10 (EMA, información de producto en PDF)

- **Documentos:** el PDF en castellano del EPAR de cada medicamento de uso humano autorizado con ATC 5
  (1 400), con la URL que publica su página.
  - Bajados 1 397, con sha256 en la meta; 3 dan 404 y no se prueba otra URL.
  - 12 no los puede abrir `pdfminer` («No /Root object!») y en 17 no se encuentra el anexo I.
- **Enlace:** por el ATC 5 que asigna la EMA. Si algún nº de autorización EU de la sección 8 está en
  CIMA (EU/1/AA/NNN/PPP → `AANNNPPP` o `1AANNNPPP`), la ficha es la misma y ya entra por CIMA. Son
  1 004 medicamentos; los 364 restantes no están en CIMA.
- **Extracción (`py/ema_pi_extract.py`, `pdfminer.six` 20260107).** Una sección se publica sólo si pasa
  todos estos controles:
  1. **Caracteres sin resolver:** ninguno (U+FFFD).
     - Cada carácter sale del mapa ToUnicode o de la codificación declarada de una fuente de texto.
     - Una fuente simbólica sin ToUnicode no se adivina: con WinAnsi, el «≥» de Symbol se leería «³».
     - Los códigos del área privada de Symbol se traducen con la tabla oficial «Adobe Symbol Encoding
       to Unicode» (unicode.org, sha256 fijado). Si la tabla da varios valores, sólo vale cuando son el
       mismo carácter en NFKC (µ/μ).
  2. **Sin filas dentro de una tabla:** el texto plano no conserva su estructura.
  3. **Completitud:** todos los glifos de la página llegan a las filas.
  4. **Sin trazos vectoriales dentro del texto:** en Besremi, 4.3, el «≥» de «clase ≥2 de la NYHA» es
     una curva y una barra, no un glifo. Un subrayado no cuenta.
  5. **Sin guion de fin de línea entre letras:** en el PDF no se distingue de un guion de corte.
  6. **Consenso con `pdftotext`:** en NFKC y sin espacios, los mismos caracteres. Sólo se admite un
     símbolo no latino que `pdftotext` deja en blanco. En Emtricitabina/Tenofovir Mylan, el ToUnicode de
     una fuente da un espacio donde el PDF dibuja el guion de «VIH-1».

  Superíndices y subíndices (10⁹/l, m²) van en `html` con `<sup>`/`<sub>`, como en CIMA.
- **Fidelidad, medida contra CIMA** en los medicamentos que están en las dos fuentes (misma sección, mismo
  nº de registro, NFKC y sin espacios), sobre las secciones publicables:

  | Sección | Idénticas a CIMA |
  |---|---:|
  | 6.2 | 941 / 971 |
  | 4.7 | 919 / 970 |
  | 4.9 | 831 / 938 |
  | 4.3 | 826 / 932 |
  | 3 | 824 / 960 |
  | 6.1 | 819 / 957 |
  | 2 | 741 / 940 |
  | 4.6 | 725 / 925 |
  | 4.1 | 723 / 892 |
  | 5.3 | 695 / 903 |
  | 4.5 | 573 / 809 |
  | 5.2 | 341 / 635 |
  | 4.4 | 330 / 696 |
  | 4.2 | 267 / 458 |
  | 5.1 | 84 / 189 |
  | 4.8 | 2 / 12 |

  Las 646 diferencias de hasta 4 caracteres se revisaron todas:
  - **582 son de versión del documento:** `pdftotext` del mismo PDF también dice lo del PDF. Por ejemplo
    Arava pasa de L04AA13 a L04AK01, Takhzyro de 1,11 a 1,07 y «sólo» de CIMA es «solo» en el PDF.
  - **64 se revisaron a mano:** versión, punto final que CIMA no trae, y una errata del propio PDF
    (Mirvaso, «por jemplo»).
  - **Errores del extractor: 0.**
  - **CIMA pierde símbolos que el PDF sí trae:** «?» en lugar de α, ≤, ≥, μ, β, ±.
- **Resultado:**
  - **Texto:** 3 671 secciones literales de 352 medicamentos que no están en CIMA. 243 de ellas llevan
    `html` con superíndices.
  - **Punteros:** las secciones que no pasan los controles quedan en el puntero al PDF oficial, con su
    motivo: tabla 1 137, `pdftotext` no coincide 275, guion de fin de línea 242, trazo dibujado 145,
    glifo sin resolver 12.
  - **Total:** 491 punteros en `pharmacology_external_documents`. 0 ATC 5 nuevos.
- **Riesgo residual:** un ToUnicode equivocado que los dos extractores leen igual. La comparación con
  CIMA no encontró ninguno.

## Cobertura medida (tras la pasada 10, granularidad por vía)

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

Requisitos cubiertos, por fuente. Una monografía es «completa» si una sola fuente cubre los diez. La
columna de la eEML cuenta cero porque sus referencias no son secciones; con texto, la pasada 5 había
medido 509 indicaciones:

| Requisito | CIMA (2 158) | openFDA (1 490) | EMA (822) | eEML (509, solo referencias) | LactMed (1 131) | LiverTox (657) |
|---|---:|---:|---:|---:|---:|---:|
| Mecanismo de acción | 2 151 | 1 395 | 0 | 0 | 0 | 0 |
| Farmacocinética | 1 989 | 1 393 | 0 | 0 | 0 | 0 |
| Indicaciones | 2 152 | 1 486 | 822 | 0 | 0 | 0 |
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

- **LINAME sin monografía: 54 de 482.** Ninguno tiene medicamentos con ese código en CIMA ni en la
  EMA. La causa, por código (no se corrige ningún código ni se enlaza por nombre):

  | Causa | ATC 5 |
  |---|---|
  | No figura en la maestra ATC de la AEMPS (5) | B01AX06, J05AX14, J05AX27, L01XC99, N02AA07 |
  | El GSRS asigna varios ATC 5 al mismo principio: sus etiquetas son ambiguas por código (31) | A06AD04, A12CD01, B02BX01, B03AC02, B05CB01, B05CB04, B05CX04, C01CA01, C03AX01, D01AA01, D01AC06, D01AE02, D10AX02, G01AA01, G01AD02, G03EA03, G03FA10, G03FB09, J01BA01, J01GB04, J05AX08, L01XX19, N01AX01, N02CA72, P02CA02, R03DA05, S01AX13, V03AB01, V03AB18, V08BA02, V08CA01 |
  | El GSRS asigna sólo ese ATC 5, pero ningún documento de las fuentes queda enlazado a él (4) | A06AC07, C02AB02, D03AX12, M03AC10 |
  | Ni el GSRS ni RxNav conocen el código: antisueros, vacunas, combinaciones y códigos que la AEMPS no usa en ningún producto (14) | A01AB11, A06AG06, B03AE10, B05CB10, D01AA20, J05AF30, J06AA02, J06AA03, J06AA06, J07BD53, J07BX03, L04AA01, L04AA05, L04AA09 |

  La lista también está en `data/coverage.json.gz` → `gaps.linameEssentialWithoutMonograph`.
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
la descripción de los PR 730, 835 y el de la pasada 10.

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
| Pasada 9 sin texto de la eEML, 1.ª (base nueva) | 3 959 | 3 943 | 3 945 | 99 838 | 429 | 0 | 46 s |
| Ídem, 2.ª | 0 | 0 | 0 | 0 | 0 | 0 | 25 s |
| **Pasada 10, 1.ª** (base nueva) | **3 959** | **3 943** | **3 945** | **99 995** | **429** | 0 | 42 s |
| **Pasada 10, 2.ª** | 0 | 0 | 0 | 0 | 0 | 0 | 24 s |
| Pasada 10 sobre la base anterior (actualización) | 0 | 0 | 0 | 226 | 0 | 69 | 24 s |
| Ídem, otra vez | 0 | 0 | 0 | 0 | 0 | 0 | 23 s |
| **Pasada 10 con texto verificado, 1.ª** (base nueva) | **3 959** | **3 943** | **3 945** | **103 684** | **429** | 0 | — |
| **Ídem, 2.ª** | 0 | 0 | 0 | 0 | 0 | 0 | — |
| Ídem sobre la base de la pasada 10 sin texto (actualización) | 0 | 0 | 0 | 4 156 | 0 | 467 | — |
| Ídem, otra vez | 0 | 0 | 0 | 0 | 0 | 0 | — |

- **Tamaño de `concept_properties`, recién cargado:** 342 MB con la pasada 5, 374 MB con la 9 y
  384 MB con la 10 con texto verificado.
- **Integridad del texto:** de las 81 075 secciones de la pasada 10, ninguna tiene un `textSha256`
  distinto del sha256 del texto guardado. Las 3 671 de la EMA (PDF): 0 con U+FFFD, todas `professional`.
- **Atribuciones:** ninguna de LactMed ni de LiverTox carece de «Courtesy of the U.S. National Library
  of Medicine». La eEML no tiene filas de texto que atribuir: sus referencias llevan la licencia y su
  enlace.
- **Corpus de `data/`:** 81 075 secciones, ninguna de la eEML y ninguna fuera de `professional`.
- **Punteros sin texto:** en `pharmacology_external_documents`, 275 de DailyMed, 988 de la eEML y 491 de
  la EMA (PDF). Ninguno lleva texto.
- **`validate-links`:** 429 de los 483 ATC 5 de `vademecum` tienen monografía y su `concept_map`.
- **`drug-treatments`** (ya en `dev`): enlazados por RxCUI o UNII, sin base de datos.
  Llegan a una monografía 3 240 de 4 842 fármacos y 12 657 de 18 032 afirmaciones, que suman 1 465
  ATC 5 distintos.

## Fuentes evaluadas sin pasada

| Fuente | Qué aportaría | Por qué no tiene pasada |
|---|---|---|
| NCI Thesaurus (definiciones de agentes, con `FDA_UNII_Code`) | Definición del agente por UNII | Una definición no es una sección de monografía, y forzarla en una clave cambiaría su sentido |
| Health Canada (Drug Product Database / monografías) | Monografías canadienses | En PDF: el mismo límite de extracción que la pasada 10. Además, la licencia de reproducción no se verificó |
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
