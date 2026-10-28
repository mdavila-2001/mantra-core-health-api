# Cuidados de enfermería — bitácora de búsqueda, saturación y cobertura

Rama `justin/seed-nursing-care` · importador en `tools/terminology-import/nursing-care/`
· fuentes y licencias en `tools/terminology-import/nursing-care/SOURCES.md`.

Pedido del propietario: «que se busque completamente el VADEMÉCUM médico para… cuidados médicos de
enfermería, con los mismos requerimientos». Esta sesión es la **dueña de enfermería**.

## Resumen

| | Cargado | Fuente |
|---|---|---|
| Conceptos | **8 644** (openEHR CKM 8 015 · CMDIC del Ministerio de Sanidad 617 · registro de terminologías 12) | ver tabla de pasadas |
| Subconjunto de enfermería | 101 arquetipos (78 CKM + 23 CMDIC) y los 1 099 conceptos que contienen (957 CKM + 142 CMDIC) | reglas N1–N11 y M1–M3 |
| En castellano | CKM: 77 arquetipos, 648 nodos, 366 respuestas (traducción publicada en CKM) · CMDIC: 617 (original) | — |
| Jerarquía | 8 040 relaciones: 7 958 `PART_OF` (arquetipo → nodo → respuesta) y 82 `IS_A` (especialización) | estructura publicada por la fuente |
| Glosario «Cuidados de enfermería» | 36 términos nuevos (28 CKM + 8 CMDIC) | antes tenía 5 curados a mano |
| Escalas de valoración | 33 arquetipos del subconjunto de enfermería son escalas o instrumentos con contenido retenido por licencia (sólo metadatos) | ver «Escalas» |
| Relaciones con enfermedades y síntomas | **0** (ninguna fuente alcanzable las publica; no se infieren) | ver «Huecos» |
| Enlaces a LOINC | 126 enlaces declarados por los arquetipos (101 códigos distintos); se resuelven por código contra `loinc` en la base | `concept_maps` |

Medido en una base PostgreSQL 16 desechable con el DDL de `database/SQL` (módulo 03):
primera corrida 8 644 conceptos, 9 646 designaciones, 120 991 propiedades, 8 040 relaciones, 173
membresías; **segunda corrida 0 filas** (idempotente).

## Red de esta sesión

El contenedor sólo alcanza **GitHub** (git y assets de releases), **npm** y **PyPI**. Todo lo demás
devuelve 403 al CONNECT o no resuelve (sondeado el 2026-10-24): `www.omahasystem.org`,
`clinicaltables.nlm.nih.gov`, `eutils.ncbi.nlm.nih.gov`, `www.ebi.ac.uk`, `ckm.openehr.org`,
`www.icn.ch`, `www.sabacare.com`, `rnao.ca`, `www.nice.org.uk`, `jbi.global`, `www.who.int`,
`iris.who.int`, `iris.paho.org`, `icd.who.int`, `id.who.int`, `evs.nci.nih.gov`, `loinc.org`,
`fhir.loinc.org`, `www.minsalud.gob.bo`, `snis.minsalud.gob.bo`, `www.sanidad.gob.es`,
`www.minsal.cl`, `www.imss.gob.mx`, `www.cenetec.salud.gob.mx`, `www.cenetec-difusion.com`,
`packages.fhir.org`, `packages2.fhir.org`, `tx.fhir.org`, `www.wikidata.org`, `query.wikidata.org`,
`zenodo.org`, `huggingface.co`, `datos.gob.es`, `datos.gob.mx`, `datos.gob.cl`, `www.datos.gov.co`,
`bvsalud.org`, `scielo.org`, `api.crossref.org`, `api.openalex.org`, `api.semanticscholar.org`.
La búsqueda web (del lado del servidor) se usó **sólo para descubrir fuentes y verificar licencias**;
ningún dato que pase por un resumen de modelo se cargó. No se eludió ningún bloqueo ni CAPTCHA.

## Cierre de huecos — 2026-10-27

La red de esta sesión (2026-10-27) ya alcanza a `www.omahasystem.org`, al NLM (Clinical Tables), a `www.sanidad.gob.es`, a `ckm.openehr.org`, a `www.minsalud.gob.bo`, a `www.imss.gob.mx` y a `www.minsal.cl`; `loinc.org` sigue dando 403. Evidencia en `docs/trabajo/2026-10-27-terminologia-cierre-huecos/evidencia/C8/`. Cargas medidas en un **Postgres 16 desechable** (no en la base del stack): 1.ª corrida con las filas nuevas, 2.ª con **0** y consultas de integridad (0 duplicados, 0 huérfanos, 0 nulos) pegadas en la evidencia.

| Hueco | Estado el 2026-10-24 | Estado hoy | Qué se cargó | Antes → después |
|---|---|---|---|---|
| **Omaha System** (dominio público) | host inaccesible | `omahasystem.org` 200; `omahasystemmn.org` 200 | parser contra el sitio oficial, la imagen de la PRSO y el suplemento del MOSUG: 4 dominios, 42 problemas, 4 categorías, 76 objetivos, modificadores, PRSO y 168 signos/síntomas de 18 problemas con su definición | 0 → **320** conceptos (`omaha-system`), 231 relaciones |
| Omaha: signos/síntomas de 24 problemas, códigos numéricos, definiciones de objetivos | — | sólo en el libro de 2005 (Apéndices A y E) | nada (sin fuente abierta; no se inventa) | hueco de licencia/curaduría |
| **LOINC** (paneles y escalas) | enlaces sin resolver | NLM Clinical Tables 200 (`loinc.org` 403) | los 126 enlaces: **47 términos LOINC enlazados, los 47 resueltos** (48 `concept_maps` en la base desechable); 54 códigos `LA…` son respuestas de LOINC, no términos | 0 → 48 mapas |
| LOINC `[OMAHA]` | — | 403 términos publicados | guardados como referencia (`data/loinc-omaha-terms`); sin cruce por nombre | — |
| **CMDIC** (licencia) | «no declarada» | Aviso legal del Ministerio leído hoy | reutilizable (comercial y no comercial) con 3 condiciones; el `.zip` oficial = el corpus (617/617) | licencia confirmada |
| **Glasgow (adultos)** | sin verificar | titular: «no license is required» (clínica e investigación) | contenido de la escala | 0 → 22 conceptos (8 015 → 8 037) |
| NEWS2 | sin verificar | titular: libre, pero «must not be modified/amended» | nada | decisión del propietario |
| Braden, Barthel, Waterlow, MUST | sin verificar | licencia/permiso exigidos | nada | hueco de licencia |
| Norton, EMINA, Cubbin-Jackson, Morse | sin fuente | sin fuente abierta con licencia | nada | hueco |
| Protocolos Bolivia / España / MINSAL / IMSS | hosts bloqueados | Bolivia, España, MINSAL, IMSS responden 200 | nada: Bolivia no publica manual de enfermería; IMSS y GuíaSalud son NC; MINSAL sin licencia legible; `cenetec-difusion.com` es spam | hueco de licencia/curaduría (ver SOURCES.md) |

Conteos por code system (antes → después): `openehr-ckm` 8 015 → 8 037 · `es-msssi-cmdic-13606` 617 → 617 · `nursing-terminology-registry` 12 → 12 · `omaha-system` 0 → 320 · **total 8 644 → 8 986**. Subconjunto de enfermería: 101 arquetipos y 1 099 conceptos → 101 y 1 121 (los 22 de Glasgow).

**No cubierto**: el contenido de las 196 escalas retenidas; los signos/síntomas de 24 problemas de Omaha; la traducción al castellano de Omaha (no hay oficial); la carga en la base real del stack (sólo Postgres desechable); la verificación de la transcripción visual de la PRSO contra el original impreso (sólo se contrastó con LOINC).

## Pasadas (protocolo de saturación)

Aportes nuevos contados **por code system + código** tras deduplicar.

| # | Fecha | Fuentes | Términos | Procedimientos / valoraciones | Escalas | Relaciones | Descartadas en la pasada (motivo) |
|---|---|---|---|---|---|---|---|
| 1 | 2026-10-24 | openEHR CKM, espejo oficial `openEHR/CKM-mirror@c3fdc43d` (incluye remotos UK y Noruega) | 8 015 | 616 arquetipos (signos vitales, balance de líquidos, heridas, catéteres, medicación, transfusión, plan de cuidados, educación…) | 33 instrumentos del subconjunto con contenido retenido por licencia (ver abajo) | 7 481 (7 399 PART_OF · 82 IS_A) + 126 enlaces LOINC | 73 arquetipos de composición/sección/demográficos (no son términos clínicos); 281 enlaces SNOMED (licencia) |
| 2 | 2026-10-24 | HL7 Terminology `hl7.terminology@7.0.1` (npm, CC0) | 12 (registro de terminologías ANA) | 0 | 0 | 0 | contenido de NANDA-I, NIC, NOC, PNDS, CCC, ICNP (licencia); Omaha (host) |
| 3 | 2026-10-24 | Region Stockholm, fork del espejo CKM `@18edd9e2` | 0 | 0 | 0 | 0 | 687 archivos: versiones anteriores de los mismos ids o locales en sueco |
| 4 | 2026-10-24 | Ministerio de Sanidad, arquetipos ISO 13606 del CMDIC (`openEHR/adl-archetypes@093c77ea`) | 617 | 58 arquetipos: **Informe de Cuidados de Enfermería**, antecedentes de enfermería, valoración activa, resultados, protocolos, 6 signos vitales… | 0 | 559 PART_OF + 16 ranuras del informe de enfermería (propiedad) | 58 `.adls` (duplicado ADL 1.5) |
| 5 | 2026-10-24 | Resto de `openEHR/adl-archetypes` (AML-reference, ADL2-reference, Example, Development: Intermountain, CDISC, CIMI) | 0 | 0 | 0 | 0 | 535 archivos de prueba/ejemplo de herramientas o versiones viejas de CKM |
| 6 | 2026-10-24 | Búsqueda de espejos nacionales de CKM (Noruega, Alemania, Australia) y de paquetes FHIR de enfermería (KL Dinamarca FSIII, Open Nursing Core IG) | 0 | 0 | 0 | 0 | no hay espejo público alcanzable; paquetes FHIR en hosts bloqueados; FSIII en danés |
| 7 | 2026-10-24 | NCI Thesaurus OBO Edition `v2024-05-07` (24.04e, GitHub release, SHA-256 `e90ebb7e…5d1a`) | 0 | 0 | 0 | 0 | la rama `Nursing` (C16926, 43 conceptos) y `Nurse` (C20821, 63) son disciplinas y ocupaciones, no cuidados; técnicas sin clasificación de enfermería; inglés; el code system `ncit` lo crea `justin/seed-procedures-treatments` |
| 8 | 2026-10-24 | Literatura (búsqueda web, sólo huecos): Gerokomos (EVRUPP en España), TFG UVa, ANA 2015, FAQ Omaha, ICN Q&A 2020 | 0 | 0 | 0 | 0 | identifica escalas sin fuente cargable: Norton, Norton modificada, EMINA, Cubbin-Jackson, Morse |

**Saturación**: las pasadas 5, 6, 7 y 8 aportan 0 → con la red de esta sesión no hay más que
encontrar. El resto está detrás de hosts bloqueados o de licencias (tabla «Huecos»).

## Jerarquía (dominio → clase → elemento)

- **openEHR CKM**: arquetipo (clase de observación, acción, instrucción, evaluación o cluster) → cluster
  → elemento → respuesta codificada, con el valor ordinal cuando la fuente lo declara. Las
  especializaciones (`specialise`) son `IS_A` del arquetipo padre.
- **CMDIC**: informe (COMPOSITION) → sección → entrada → cluster → elemento; las ranuras dicen qué
  arquetipo va en cada lugar del informe.
- **Diagnósticos, intervenciones y resultados de enfermería** con jerarquía propia (NANDA-I
  dominio → clase → diagnóstico; NIC campo → clase → intervención; NOC; Omaha dominio → problema →
  signo/síntoma; CCC componente de cuidado): **no cargados** (licencia u host). El CMDIC deja la
  estructura del informe con sus secciones «Diagnósticos enfermeros activos/resueltos», «Resultados
  de enfermería» e «Intervenciones de enfermería», pero el RD exige ahí NANDA-NOC-NIC, que no se puede
  cargar.

## Escalas de valoración

| Escala pedida | En el corpus | Licencia verificada | Qué se cargó |
|---|---|---|---|
| Braden | `openEHR-EHR-OBSERVATION.braden_scale.v1` (+ Braden Q) | © Braden y Bergstrom 1988, aviso en el propio arquetipo | metadatos (sin ítems) |
| Norton | **no está** | sin declaración encontrada | — (hueco) |
| Morse | **no está** | copyright; uso con permiso de la autora (secundaria) | — (hueco) |
| Downton | `downton_fall_risk_index.v0` | sin declaración encontrada | metadatos |
| Barthel | `modified_barthel_index.v0` (modificado, Shah) | © MedChi 1965; uso comercial con permiso (secundaria) | metadatos |
| Glasgow | `glasgow_coma_scale.v1` y pediátrica | sin verificar (host bloqueado) | metadatos; nombre ES «Escala del coma de Glasgow» |
| Waterlow | `waterlow_score.v0` | © J. Waterlow, aviso en el arquetipo | metadatos |
| NEWS2 / NEWS | `news2.v1`, `news_uk_rcp.v1` | sin verificar | metadatos |
| Otras de enfermería del corpus | RASS (©), MUST, MST (©), NRS-2002, STRATIFY, Humpty Dumpty, PHFRAT, PEWS, CPOT, COMFORT-B, Abbey, Hannallah, Oucher, Bristol, Wagner, escala de riesgo cutáneo neonatal… | ninguna verificada como libre | metadatos |

Única escala con contenido completo en todo el corpus por declaración expresa de dominio público:
ECOG (oncología; fuera del subconjunto de enfermería). Todas las escalas llevan en `content_license`
el estado y la evidencia (frase del arquetipo), y las pedidas además `license_verification` con URL y
fecha. Ninguna puntuación, punto de corte ni interpretación se generó.

**Hallazgo fuera de alcance (anotado, no corregido):** la ficha de geriatría de
`src/common/seed/data/clinical-forms` dice «índice de Barthel (dominio público)». La evidencia
encontrada (MedChi, 1965) indica uso libre sólo no comercial; para AloVida conviene confirmarlo.

## Procedimientos y técnicas cubiertos (modelos clínicos, no protocolos)

Signos vitales (presión arterial, pulso, temperatura, respiración, oximetría, peso, talla, IMC, relleno
capilar, AVPU/ACVPU; y los 6 del CMDIC), balance de líquidos (ingreso, egreso, egreso sanguíneo,
heces), heridas y quemaduras (examen de herida, de quemadura, superficie quemada, Wagner), catéteres
(luz, manguito, tubo), medicación (gestión de la medicación como ACTION con sus pasos, orden de
medicación, oxígeno suplementario), transfusión (orden, gestión, unidad), plan y vía de cuidados,
educación sanitaria, requisitos de apoyo funcional, nota de evolución. **Ostomías: 0** (no hay
arquetipo en el espejo). **Protocolos paso a paso** (curaciones, sondajes, accesos venosos) **no**:
ninguna fuente alcanzable los publica con licencia y en formato legible; no se redactan.

## Relaciones con enfermedades y síntomas

**0 relaciones.** Ni openEHR CKM, ni el CMDIC, ni el registro THO publican «cuidado ↔ enfermedad» o
«cuidado ↔ síntoma». No se infieren por nombre. Fuentes que sí las publican y quedan como hueco:

| Fuente | Relación publicada | Bloqueo |
|---|---|---|
| Omaha System | problema → signos y síntomas; problema → intervenciones | host (`www.omahasystem.org`) |
| NANDA-I | diagnóstico → características definitorias, factores relacionados | licencia |
| NIC/NOC | vínculos NANDA-NIC-NOC | licencia |
| Guías de práctica clínica de enfermería (CENETEC/IMSS, RNAO, NICE) | guía → diagnóstico CIE-10 | hosts bloqueados; a verificar al habilitar |

Las ramas hermanas (`justin/seed-diseases`, `justin/seed-symptoms`, `justin/seed-medical-dictionaries`)
**no existen todavía** en `origin` (2026-10-24). `justin/seed-procedures-treatments` sí: sus 23
archivos nuevos no mencionan enfermería; carga `maxo`, `ncit`, `ohd`, sin solaparse por code system
con esta rama. `link-check.mjs` repite el control (git y, con `--db`, por código en la base).

## Huecos y licencias

| Hueco | Requisito | Quién lo da |
|---|---|---|
| Omaha System — lo que sólo está en el libro (códigos, signos/síntomas de 24 problemas, definiciones de objetivos) | el libro de 2005 (Health Connections Press) o un permiso para volcar sus Apéndices A y E; **confirmar además** que cargar los términos en un producto comercial entra en el uso libre de la FAQ | propietario (licencia / editorial) |
| CCC v2.5 | leer y aceptar el acuerdo de SabaCare | propietario (licencia) |
| ICNP / CIPE en castellano | licencia del CIE (tasas comerciales) | propietario (licencia) |
| NANDA-I, NIC, NOC | licencia comercial | propietario (licencia) |
| LOINC (paneles de enfermería y escalas) | los 47 términos enlazados están en el subconjunto público del NLM; cargar `import-loinc.mjs` en la base real para que los 48 mapas se creen | propietario (carga en el stack) |
| Norton, Norton modificada, EMINA, Cubbin-Jackson, Morse | una fuente con licencia verificada | propietario |
| Contenido de escalas (Braden, Barthel, Glasgow, Downton, NEWS2…) | permiso o licencia del titular; el importador lo habilita con un *override* con evidencia primaria (`LICENSE_OVERRIDES`) | propietario (licencia) |
| CMDIC del Ministerio | **cerrado 2026-10-27** (Aviso legal); queda cumplir las 3 condiciones (no desnaturalizar, citar, fecha de actualización) | — |
| Protocolos de enfermería de Bolivia, España, MINSAL, IMSS | hosts ya alcanzables: no hay documento libre (ver «Cierre de huecos 2026-10-27» y SOURCES.md) | propietario (licencia) |
| Ostomías | no hay arquetipo en CKM | — |
| *Share-alike* de CC-BY-SA (CKM) | decidir el alcance de la obligación sobre obras derivadas | legal |

## Repo del modelo

Lo cargado entra en las tablas existentes del módulo 03 (`catalog_concepts`, `concept_designations`,
`concept_properties`, `concept_relationships`, `concept_maps`, `value_sets`): **no hace falta DDL**.
Las relaciones cargadas son estructurales de una sola fuente (ambos extremos en el mismo code system
y la procedencia completa en cada concepto). Para cargas futuras con relaciones **entre fuentes**
(Omaha problema → síntoma, guía → CIE-10), esta sesión adhiere a la propuesta
`terminology.concept_relationship_assertions` de `justin/seed-procedures-treatments`
(`docs/seed-research/procedures-treatments.md`), que guarda fuente, id de origen, versión, URI y
fecha por relación.

## Lo que se cargó y no responde a ninguna consulta todavía

Los 7 058 conceptos de CKM fuera del subconjunto de enfermería (arquetipos clínicos generales, sus
nodos y respuestas, con 99 415 propiedades) y los 475 del CMDIC fuera del subconjunto quedan como
catálogo de referencia: ninguna pantalla los consulta hoy. Todo el esquema `terminology` de la base
desechable, con estas cargas, ocupa 45 MB. Los 12 del registro de terminologías sólo documentan licencias.

## Corrección posterior a la revisión independiente (2026-10-28)

- Omaha (`omaha-system`) y la escala de Glasgow de adultos NO se cargan por defecto: el cargador los omite salvo `--owner-approved=omaha-system` / `--owner-approved=glasgow-coma-scale` con `--approval-ref="quién, cuándo, dónde consta"` (Omaha: la FAQ pide contactar a la editorial a quien vende software; Glasgow: el permiso cubre atención clínica e investigación sin costo y las filas vienen de un arquetipo CC BY-SA). Ya cubierto por `test/omaha.test.mjs`.
- CMDIC: las 617 filas versionadas llevan `reuse-allowed-with-conditions` (0 con `official-publication-license-not-stated`); un test sobre `data/` lo exige.
- Los hash de Omaha no dependen de `retrievedAt` (se agrega al cargar desde `omaha-meta`); test en `test/omaha.test.mjs`.
- `test/disposable-db/fresh-db.sh` sólo corre con servidor local y base `*_test`; probado en `test/nursing-care.test.mjs`.
