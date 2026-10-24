# Farmacología clínica — registro de pasadas y cobertura

Rama `justin/seed-clinical-pharmacology`. Importador: `tools/terminology-import/clinical-pharmacology/`
(fuentes y licencias en su `SOURCES.md`). Pedido: una monografía por principio activo de uso clínico
con clase ATC (5 niveles), mecanismo, farmacocinética, indicaciones, posología, contraindicaciones,
advertencias, interacciones, reacciones adversas con frecuencia, embarazo y lactancia, sobredosis,
formas y vías; todo lo clínico **literal** de una fuente oficial y citado.

## Estado: NO saturado — bloqueado por la red de la sesión

La sesión que escribió el importador (2026-10-24) no tenía salida a ninguna fuente: el proxy de
egreso devolvió **403** a `cima.aemps.es`, `api.fda.gov`, `download.open.fda.gov`,
`dailymed.nlm.nih.gov`, `www.ema.europa.eu`, `rxnav.nlm.nih.gov`, `www.whocc.no`,
`list.essentialmeds.org`, `www.who.int`, `iris.who.int`, `api.cpicpgx.org`, `api.pharmgkb.org`,
`ddinter2.scbdd.com`, `www.minsalud.gob.bo`, `www.ebi.ac.uk` y `eutils.ncbi.nlm.nih.gov` (también
vía WebFetch). Sólo estaban abiertos los registros de paquetes y GitHub.

Por eso las pasadas 1 y siguientes figuran como **bloqueadas**, no como «0 nuevos»: un cero por
bloqueo no es saturación y **no cuenta** para la regla de «dos pasadas seguidas con 0». La orden
del propietario de iterar con `/loop` hasta que sea imposible encontrar más tampoco se pudo
cumplir: cada iteración habría sido otro 403. Para retomarla hay que habilitar los hosts en
*Network access* del entorno (lista en `SOURCES.md`) y correr las pasadas en el orden de abajo.

## Pasadas

Deduplicación siempre por código (ATC 5; dentro de CIMA, nº de registro; en openFDA, `set_id`),
nunca por nombre.

| # | Fecha | Fuentes | ATC 5 nuevos | Secciones nuevas | Resultado |
|---|---|---|---:|---:|---|
| 0 | 2026-10-24 | Archivos ya en el repo: LINAME 2022-2024 (482 ATC 5), dataset `vademecum` (483 ATC 5) | 483 (universo) | 0 | Fija el universo inicial. Ninguna de las dos trae texto clínico (la LINAME no tiene indicaciones, dosis ni contraindicaciones), así que no genera monografías. |
| 1 | 2026-10-24 | CIMA: listado, detalle, maestra ATC, fichas técnicas completas, notas de seguridad | — | — | **Bloqueada (403).** Código y parser validados con respuestas reales ya versionadas. |
| 2 | 2026-10-24 | RxNav (ATC 5 → RxCUI → UNII) + openFDA drug labels | — | — | **Bloqueada (403).** Código listo; parser de openFDA/RxNav sin validar contra datos reales. |

### Pasadas planificadas (en este orden, cada una con fuentes nuevas e independientes)

1. **CIMA, granularidad por (VTM, vías)** — `fetch-cima.mjs`. Universo esperado: los ATC 5 de los
   25 470 medicamentos del catálogo. Mide cuántos ATC 5 y secciones nuevas aporta.
2. **RxNav + openFDA** — `fetch-rxnorm.mjs` y `fetch-openfda.mjs`. Aporta secciones en inglés para
   los ATC 5 ya vistos y ATC 5 nuevos de la LINAME/maestra que CIMA no comercializa.
3. **CIMA exhaustiva** — `fetch-cima.mjs --granularity product`: todas las fichas segmentadas, no
   sólo la de referencia. Aporta secciones (otros titulares/vías), no ATC nuevos.
4. **DailyMed** — sólo etiquetas que openFDA no indexa (por `set_id`). Requiere un fetcher nuevo.
5. **EMA (centralizados) y Formulario Terapéutico Nacional de Bolivia** — PDF: requieren parser
   validado contra archivos reales; no se escribe a ciegas.
6. **Maestras de ATC sin producto** — ATC 5 de la maestra de CIMA sin ficha en ninguna fuente:
   quedan como hueco documentado (código y nombre AEMPS, sin monografía).

La saturación se declara cuando dos pasadas seguidas de esta lista (u otras nuevas) aportan 0 ATC 5
y 0 secciones tras deduplicar.

## Fuentes descartadas

| Fuente | Motivo |
|---|---|
| vademecum.es, PLM, BNF, Martindale, Lexicomp, Medscape | Copyright comercial: sólo para detectar huecos. |
| MedDRA | Licencia por suscripción; las reacciones adversas quedan como texto literal con su tabla y frecuencia. |
| WHO ATC/DDD (WHOCC) | Sin redistribución comercial del índice; nombres ATC desde la AEMPS; DDD no cargadas. |
| WHO Model Formulary / EML | © OMS / CC BY-NC-SA 3.0 IGO (no comercial): decisión del propietario. |
| DDInter, ONC High-Priority DDI | Licencia no verificada / sin archivo oficial. Interacciones = texto literal de la ficha. |
| PharmGKB/ClinPGx, CPIC | CC BY-SA 4.0 / licencia por confirmar; farmacogenómica sólo desde la etiqueta FDA. |
| AGEMED | reCAPTCHA: no se elude. Pedir la base por acceso a información pública. |
| SNOMED CT | Bolivia no es miembro de SNOMED International. |
| PubMed / Europe PMC / Google Scholar | Literatura: descubrir fuentes, no contenido de monografía. |

## Cobertura medida (2026-10-24)

`coverage-report.mjs` sobre lo disponible (sólo pasada 0):

| Métrica | Valor |
|---|---:|
| Universo ATC 5 (LINAME ∪ vademecum) | 483 |
| Monografías | 0 |
| Secciones (cualquier fuente) | 0 |
| LINAME esenciales sin monografía | 482 |
| Cruce con el catálogo de productos | no medido (los `medicines-*.ndjson` no están en la sesión) |

El informe completo (por nivel ATC, por fuente y requisito, sin match con el catálogo de productos
en los dos sentidos, huecos del armado) se regenera con `coverage-report.mjs` después de cada
pasada y se pega acá.

## Carga y enlaces verificados

En un Postgres 16 desechable con el DDL de `database/SQL/00_shared` y `03_terminology` tal cual
(sin la API, sin DDL nuevo), con la ficha real de bencilpenicilina procaína (CIMA nº reg. 15419,
versión 2026-04-16) como única caché:

| Corrida | Conceptos | Designaciones | IS_A | Propiedades | `concept_maps` → vademecum | Borradas |
|---|---:|---:|---:|---:|---:|---:|
| 1.ª | 5 | 3 | 4 | 14 | 1 | 0 |
| 2.ª (misma fuente) | 0 | 0 | 0 | 0 | 0 | 0 |
| Ficha con fecha nueva | 0 | 0 | 0 | 2 | 0 | 2 |
| Vuelta a la versión original | 0 | 0 | 0 | 2 | 0 | 2 |

El `textSha256` guardado coincide con el sha256 del texto de la ficha real. `validate-links.mjs`
encontró el `concept_map` J01CE09 → `vademecum` y, con una relación fármaco→enfermedad simulada
(J01CE09 y N02BE01), informó correctamente N02BE01 como ATC 5 sin monografía.

**Ramas hermanas:** `justin/seed-drug-treatments` y `justin/seed-diseases` no existían en
`origin` al 2026-10-24, así que el enlace con sus datos no se validó. `validate-links.mjs` queda
listo: revisa por código cualquier `concept_relationships` cuyo extremo sea un concepto con código
ATC 5 (de cualquier code system) y los RxCUI del puente contra `rxnorm_full`/`rxterms`.
