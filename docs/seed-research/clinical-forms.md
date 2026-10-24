# Fichas clínicas: ampliación con estándares internacionales

Sesión del 2026-10-24 (rama `claude/intelligent-johnson-q0ll9g`, base `dev` en `08a7ff8a`).
Pedido del propietario: «mejorar los formularios clínicos existentes, revisando más estándares
internacionales por el mundo», en pasadas sucesivas hasta que dos seguidas no aporten nada.

## Resultado

|                   | Antes (`dev`) | Después | Diferencia |
| ----------------- | ------------: | ------: | ---------: |
| Fichas            |           370 |     374 |         +4 |
| Fichas mejoradas  |             — |      29 |  versión+1 |
| Campos            |         6 164 |   6 373 |       +209 |
| Opciones de lista |        10 272 |  11 202 |       +930 |

El brief hablaba de 368 fichas: son las 368 que arma el generador más las 2 que se escribieron a
mano en v4.2.0 (SRQ-20 y AUDIT de la OMS), 370 archivos en total.

**Fichas nuevas** (cuatro, todas `SPECIFIC`, cada una cubre una condición que no tenía ficha):

| Código                           | Ficha                                                          | Fuente                          |
| -------------------------------- | -------------------------------------------------------------- | ------------------------------- |
| `GASTRO_CTRL_COLITIS_ULCEROSA`   | Control de colitis ulcerosa (puntaje de Mayo)                  | CKM openEHR `mayo_score.v1`     |
| `INFECTO_CTRL_ITS`               | Infecciones de transmisión sexual: evaluación y control        | DAK de la OMS: VIH y FP/ITS     |
| `ENFER_CTRL_VACUNACION`          | Vacunación: registro de la dosis y de eventos adversos (ESAVI) | DAK de inmunizaciones de la OMS |
| `PATOL_INFORME_BIOPSIA_PROSTATA` | Informe de biopsia de próstata (Gleason y grupo ISUP)          | CKM openEHR `gleason_score.v0`  |

**Fichas mejoradas** (29; cada una sube `version`, porque `ClinicalFormsSeedService` sólo
reconcilia una plantilla ya sembrada cuando la versión del catálogo es mayor):

| Ficha                            | Versión | Qué se agregó                                                                                                                                                                                                                                          | Fuente                                                              |
| -------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| `PEDIA_RECIEN_NACIDO`            | 1→2     | Ítems del Apgar al minuto y a los 5 min; examen físico del neonato (temperatura, piel, ictericia, fontanelas, ojos, cordón, malformaciones, genitales, ano, columna); alimentación; posición para dormir; vitamina K; 8 signos de peligro que faltaban | CKM `apgar.v2` (traducción del CKM); DAK PNC                        |
| `CARDIO_CTRL_FA`                 | 1→2     | Factores de HAS-BLED                                                                                                                                                                                                                                   | CKM `has_bled.v0`                                                   |
| `GASTRO_CTRL_HEPATOPATIA`        | 1→2     | Los 5 ítems de Child-Pugh                                                                                                                                                                                                                              | CKM `child_pugh_score.v0`                                           |
| `UCI_CTRL_SEPSIS`                | 1→2     | Los 6 componentes de SOFA                                                                                                                                                                                                                              | CKM `sofa_score.v0`                                                 |
| `OBST_TRABAJO_DE_PARTO`          | 1→2     | Los 5 ítems del puntaje de Bishop                                                                                                                                                                                                                      | CKM `bishop_score.v0` (corregido)                                   |
| `ANEST_VALORACION_PREANESTESICA` | 2→3     | Índice de riesgo cardíaco revisado (Lee)                                                                                                                                                                                                               | CKM `revised_cardiac_risk_index.v1`                                 |
| `MEDINT_CTRL_MULTIMORBILIDAD`    | 1→2     | Índice de comorbilidad de Charlson                                                                                                                                                                                                                     | CKM `charlson_comorbidity_index.v2` (traducción del CKM, corregida) |
| `ENDO_CTRL_DM2`                  | 1→2     | Grado de Wagner de la úlcera de pie                                                                                                                                                                                                                    | CKM `diabetic_wound_wagner.v0` (traducción es-AR)                   |
| `ONCO_CTRL_PALIATIVOS`           | 1→2     | Escala de Karnofsky                                                                                                                                                                                                                                    | CKM `karnofsky_performance_status_scale.v1`                         |
| `EMERG_ACV`                      | 1→2     | Los 15 ítems de la NIHSS                                                                                                                                                                                                                               | CKM `nihss.v0`                                                      |
| `GINOBS_CTRL_PUERPERIO`          | 1→2     | Signos de peligro, molestias de 24 h, preeclampsia grave, tono y altura uterina, examen perineal o de la herida de cesárea, problemas de lactancia, indagación de depresión posnatal, método anticonceptivo                                            | DAK PNC                                                             |
| `INFECTO_CTRL_VIH`               | 1→2     | Motivos de mala adherencia, toxicidad limitante, motivo de la carga viral, fracaso terapéutico, signos de enfermedad grave, tamizaje de TB, HBsAg y VHC                                                                                                | DAK de VIH                                                          |
| `MEDFAM_CTRL_PLANIFICACION`      | 1→2     | Motivo de la visita, intención de embarazo, motivo para dejar el método, problemas con el método                                                                                                                                                       | DAK FP                                                              |
| `GINOBS_CONTROL_PRENATAL`        | 2→3     | Signos de peligro de la verificación rápida                                                                                                                                                                                                            | DAK ANC                                                             |
| `TRANSV_EPICRISIS`               | 2→3     | Secciones del IPS: alergias, vacunas, dispositivos, embarazo, estado funcional, directivas anticipadas, alertas                                                                                                                                        | HL7 FHIR IPS                                                        |
| `EMERG_DOLOR_TORACICO`           | 1→2     | Los 5 componentes de HEART                                                                                                                                                                                                                             | CKM `heart_score.v0` (corregido)                                    |
| `NEURO_CTRL_ACV`                 | 1→2     | ABCD² (sólo si es AIT)                                                                                                                                                                                                                                 | CKM `abcd2_score.v0`                                                |
| `GERIA_CTRL_CAIDAS`              | 1→2     | Índice de Downton                                                                                                                                                                                                                                      | CKM `downton_fall_risk_index.v0`                                    |
| `ANEST_CTRL_RECUPERACION`        | 1→2     | PADSS (alta ambulatoria)                                                                                                                                                                                                                               | CKM `padss.v0`                                                      |
| `PEDIA_CONTROL_NINO_SANO`        | 2→3     | Estadios de Tanner                                                                                                                                                                                                                                     | CKM `tanner.v1`                                                     |
| `NEUMO_CTRL_TB`                  | 1→2     | Resultado del tratamiento (definiciones OMS)                                                                                                                                                                                                           | DAK de VIH (`HIV.D.DE1002`)                                         |
| `NEURO_EVALUACION_BASE`          | 2→3     | Reflejos osteotendinosos por sitio y lado (0 a 5+)                                                                                                                                                                                                     | CKM `exam_tendon_reflexes.v0`                                       |
| `NUTRI_EVALUACION_BASE`          | 2→3     | NRS 2002                                                                                                                                                                                                                                               | CKM noruego `nutritional_risk_screening.v1`                         |
| `REUMA_EVALUACION_BASE`          | 2→3     | Puntaje de Beighton                                                                                                                                                                                                                                    | CKM de Clinical Models UK `beighton_score.v0`                       |
| `ENDO_EVALUACION_BASE`           | 2→3     | Ferriman-Gallwey modificada (9 áreas)                                                                                                                                                                                                                  | CKM `hirsutism_scales.v1`                                           |

Cobertura por especialidad (carpeta), antes y después:

| Especialidad (carpeta)  | Fichas antes | Fichas después | Campos antes | Campos después |
| ----------------------- | -----------: | -------------: | -----------: | -------------: |
| anestesiologia          |            2 |              2 |           54 |             60 |
| bioquimica-clinica      |            3 |              3 |           55 |             55 |
| cardiologia             |           11 |             11 |          244 |            245 |
| cirugia-general         |            9 |              9 |          161 |            161 |
| dermatologia            |           10 |             10 |          149 |            149 |
| endocrinologia          |           12 |             12 |          210 |            222 |
| enfermeria              |            2 |              3 |           41 |             56 |
| fisioterapia            |            3 |              3 |           54 |             54 |
| gastroenterologia       |           10 |             11 |          198 |            220 |
| geriatria               |            5 |              5 |           99 |            103 |
| ginecologia-obstetricia |            4 |              4 |           69 |             80 |
| hematologia             |            5 |              5 |           92 |             92 |
| infectologia            |           38 |             39 |          551 |            570 |
| medicina-deportiva      |            2 |              2 |           33 |             33 |
| medicina-emergencia     |           29 |             29 |          457 |            477 |
| medicina-familiar       |            3 |              3 |           71 |             75 |
| medicina-general        |            5 |              5 |           99 |             99 |
| medicina-intensiva      |           13 |             13 |          204 |            210 |
| medicina-interna        |           22 |             22 |          380 |            386 |
| nefrologia              |            3 |              3 |           64 |             64 |
| neumologia              |           11 |             11 |          202 |            203 |
| neurologia              |           21 |             21 |          333 |            348 |
| nutricion               |            3 |              3 |           61 |             68 |
| obstetricia             |            4 |              4 |           71 |             76 |
| odontologia             |            3 |              3 |           65 |             65 |
| oftalmologia            |           34 |             34 |          492 |            492 |
| oncologia               |            5 |              5 |           95 |             96 |
| otorrinolaringologia    |            9 |              9 |          138 |            138 |
| patologia-clinica       |            2 |              3 |           32 |             47 |
| pediatria               |           25 |             25 |          374 |            400 |
| psicologia-clinica      |            6 |              6 |          113 |            113 |
| psiquiatria             |           19 |             19 |          308 |            308 |
| radiologia              |            4 |              4 |           57 |             57 |
| reumatologia            |            5 |              5 |           93 |             94 |
| transversal             |            4 |              4 |           82 |             94 |
| traumatologia           |           21 |             21 |          305 |            305 |
| urologia                |            3 |              3 |           58 |             58 |
| **Total**               |      **370** |        **374** |    **6 164** |      **6 373** |

## El límite de este entorno (léase antes que el resto)

La sesión corrió en un contenedor cuya política de red **sólo deja salir a GitHub y al registro
de npm**. Todo lo demás devuelve `403` en el `CONNECT` del proxy (`curl` registra `000`; probado el
2026-10-24 a las 00:53 UTC): who.int, iris.who.int, iris.paho.org, smart.who.int,
minsalud.gob.bo, nice.org.uk, ckm.openehr.org, build.fhir.org, minsal.cl, diprece.minsal.cl,
cenetec-difusion.com, guiasalud.es, gpc.minsalud.gov.co, ncbi.nlm.nih.gov, loinc.org,
ninds.nih.gov, cdc.gov, ginasthma.org, goldcopd.org, kdigo.org, escardio.org, acog.org, aap.org,
diabetesjournals.org. `WebFetch` falla por DNS; la búsqueda web funciona pero devuelve
resúmenes de terceros, que **no** sirven como fuente literal.

Por eso todo lo agregado sale de fuentes publicadas como repositorios en GitHub —el espejo oficial
del CKM de openEHR, los repositorios de las SMART Guidelines de la OMS y los de HL7— congeladas en
el repo con su commit. La búsqueda web se usó sólo para **verificar licencias** y criterios
puntuales, nunca para copiar opciones.

**«Saturado» significa aquí saturado respecto de lo que este entorno puede leer.** Las guías
nacionales y de sociedades de la lista del brief quedaron sin revisar por bloqueo de red, no por
falta de contenido: ver «Huecos».

## Protocolo de saturación: registro de pasadas

| #   | Fuentes (nuevas e independientes)                                                                                                                                                                                       | Aporte tras deduplicar                                                                                                                     | Descartado y por qué                                                                                                                                                                                                                                                                                                  |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | CKM internacional de openEHR (espejo `openEHR/CKM-mirror`, commit `c3fdc43`, 2026-10-20): 241 arquetipos OBSERVATION revisados con un lector ADL propio                                                                 | 10 fichas mejoradas (Apgar, HAS-BLED, Child-Pugh, SOFA, Bishop, Lee, Charlson, Wagner, Karnofsky, NIHSS), 1 ficha nueva (colitis ulcerosa) | Instrumentos con titular o licencia no confirmada (tabla de licencias). PRO y tests psicométricos sin traducción validada al castellano en la fuente (IPSS, EPDS, K10, GPCOG). Lo ya presente en el catálogo (GCS, CURB-65, qSOFA, NYHA, ASA, ECOG, RASS, Alvarado, mRS, Aldrete, Bristol, Fitzpatrick, CHA₂DS₂-VASc) |
| 2   | DAK de la OMS: atención posnatal (`smart-dak-pnc` `1c490e4`), VIH 2023 (`smart-hiv` `b1e7735`), planificación familiar (`smart-fp` `b69bbec`), atención prenatal (`smart-anc` `301a6b8`)                                | 5 fichas mejoradas (puerperio, recién nacido, VIH, planificación, prenatal), 1 ficha nueva (ITS: no había ninguna)                         | Datos de registro y administrativos (nombre, educación, pago); esquemas de ARV y dosis (regla: el tratamiento no se transcribe a opciones); volumen y tipo de loquios (duplicaban el campo `loquios` existente)                                                                                                       |
| 3   | DAK de inmunizaciones de la OMS (`smart-immunizations` `bd7fa72`)                                                                                                                                                       | 1 ficha nueva (vacunación y ESAVI)                                                                                                         | Marcas comerciales y tipos de vacuna por producto (JE, TBE, tifoidea, cólera, meningococo): dependen del calendario nacional, que no se fija acá                                                                                                                                                                      |
| 4   | HL7 FHIR International Patient Summary (`HL7/fhir-ips` `df27097`, perfil Composition)                                                                                                                                   | Epicrisis: 7 secciones del IPS que faltaban                                                                                                | Todos los value sets del IPS (alergias, problemas, embarazo, dispositivos) son SNOMED CT; se usó sólo la estructura de secciones                                                                                                                                                                                      |
| 5   | CKM de openEHR, segundo barrido (arquetipos en desarrollo no usados en la 1) + resultado de TB de la DAK de VIH                                                                                                         | 6 fichas mejoradas (HEART, ABCD², Downton, PADSS, Tanner, resultado de TB)                                                                 | GRACE, CRUSADE, Caprini, FOUR, mini-BESTest: licencia sin verificar                                                                                                                                                                                                                                                   |
| 6   | DAK de ITS de la OMS (`smart-sti` `139574d`, 2022)                                                                                                                                                                      | **0**                                                                                                                                      | Su diccionario «New DD» repite el de planificación familiar; los value sets propios están en estado _draft_, con mapeos ICD-10 erróneos (p. ej. «Uterine tenderness» → R10, N85.8, N94.89) y casi todo ligado a SNOMED CT                                                                                             |
| 7   | CKM de openEHR, tercer barrido: clusters de `local/` y los CKM nacionales espejados en `remote/` (Nasjonal IKT de Noruega, Clinical Models UK)                                                                          | 3 fichas mejoradas (reflejos, NRS 2002, Beighton), 1 ficha nueva (biopsia de próstata con Gleason/ISUP)                                    | Cuestionarios del paciente (PROM de Oxford, HAQ, CHAQ, ICIQ, AOFAS) sin versión validada en castellano en la fuente; IIEF-5 ya prohibido por la regla del catálogo; Edmonton y STRATIFY con licencia sin verificar; Mallampati ya presente                                                                            |
| 8   | CKM de openEHR, cuarto barrido                                                                                                                                                                                          | 1 ficha mejorada (Ferriman-Gallwey modificada)                                                                                             | Berg (licencia sin verificar); SCORAD, EASI, PASI por regiones (sin ficha de dermatitis atópica; PASI ya figura como total); GOSE (sin ficha de TEC)                                                                                                                                                                  |
| 9   | Ejemplos de Questionnaire de HL7 SDC (`HL7/sdc`)                                                                                                                                                                        | **0**                                                                                                                                      | PHQ-9 (sin decisión de licencia, ver licencias), Framingham (ya presente), protocolos CAP (licencia del College of American Pathologists), MDS-RAI (interRAI), historia familiar del Surgeon General (duplica el bloque existente), formularios de demostración                                                          |
| 10  | Sitios oficiales de guías: OMS/IRIS, OPS, NICE, MINSAL Chile, IMSS/CENETEC, GuíaSalud, MinSalud Colombia, NNAC y normas 2025 de minsalud.gob.bo, sociedades (GINA, GOLD, KDIGO, ESC, ACOG, AAP, ADA), LOINC, NINDS, CDC | **0**                                                                                                                                      | Inaccesibles: `403` de la política de red del entorno (no es CAPTCHA ni licencia)                                                                                                                                                                                                                                     |

Dos pasadas seguidas sin aporte (9 y 10): el bucle se cerró. La pasada 10 es cero por
inaccesibilidad, no por saturación del contenido.

## Licencias

### De las fuentes

| Fuente                                       | Licencia                                                                                    | Qué obliga                                                                                                                                |
| -------------------------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| CKM de openEHR (arquetipos)                  | CC BY-SA 4.0 o 3.0, según el arquetipo (se lee de cada uno y se cita en la ayuda del campo) | Atribución y **compartir igual**: los campos derivados de un arquetipo heredan la licencia. Ver revisión legal                            |
| DAK de la OMS (diccionarios de datos)        | CC BY-NC-SA 3.0 IGO                                                                         | Atribución, descargo obligatorio en toda adaptación o traducción (va en la ayuda de cada campo), **uso no comercial**. Ver revisión legal |
| HL7 FHIR IPS                                 | Licencia FHIR de HL7 (contenido de la especificación en CC0)                                | Ninguna para la estructura. Sus value sets son SNOMED CT y no se usaron                                                                   |
| Vínculos SNOMED CT y LOINC de los arquetipos | SNOMED CT exige licencia de afiliado; **Bolivia no es miembro** de SNOMED International     | No se copiaron: la instantánea del CKM descarta los `term_bindings`                                                                       |

### De cada escala incorporada

Ningún arquetipo usado declara derechos de terceros (se revisaron `copyright`,
`ip_acknowledgements`, `use` y `misuse`). Las escalas son criterios clínicos publicados en
artículos: entran como **categorías clínicas**, el criterio que ya aplicaba el catálogo
(`fuentes.mjs`) con CURB-65, qSOFA, Alvarado o Centor, sin reproducir texto de los artículos.
La búsqueda web no encontró términos de licencia para ninguna.

| Escala                            | Publicación                     | Estado de licencia                                                                                                                       |
| --------------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Apgar                             | Apgar 1953                      | Sin titular conocido; uso universal                                                                                                      |
| Glasgow (ya presente)             | Teasdale y Jennett 1974         | glasgowcomascale.org: uso clínico libre, sin licencia, pide reconocer a la Universidad de Glasgow. Uso en producto comercial no aclarado |
| HAS-BLED                          | Pisters 2010; Lip 2011          | Sin términos publicados                                                                                                                  |
| Child-Pugh                        | Child 1964; Pugh 1973           | Sin términos publicados                                                                                                                  |
| SOFA                              | Vincent 1996                    | Sin términos publicados                                                                                                                  |
| Bishop                            | Bishop 1964                     | Sin términos publicados                                                                                                                  |
| Lee (RCRI)                        | Lee 1999                        | Sin términos publicados                                                                                                                  |
| Charlson                          | Charlson 1987                   | Sin términos publicados                                                                                                                  |
| Wagner                            | Wagner 1981                     | Sin términos publicados                                                                                                                  |
| Karnofsky                         | Karnofsky 1949                  | Sin términos publicados                                                                                                                  |
| NIHSS                             | Brott 1989; NINDS               | Dominio público (Gobierno de los EE. UU.)                                                                                                |
| Mayo (colitis ulcerosa)           | Schroeder 1987                  | Sin términos publicados                                                                                                                  |
| HEART                             | Six 2008; Backus 2013           | Sin términos publicados (el artículo es © Elsevier; el puntaje, no consta)                                                               |
| ABCD²                             | Johnston 2007                   | Sin términos publicados                                                                                                                  |
| Downton                           | Downton 1991                    | Sin términos publicados                                                                                                                  |
| PADSS                             | Marshall y Chung 1999           | Sin términos publicados                                                                                                                  |
| Tanner                            | Marshall y Tanner 1969–70       | Sin términos publicados                                                                                                                  |
| NRS 2002                          | Kondrup 2003 (ESPEN)            | Sin términos publicados                                                                                                                  |
| Beighton                          | Beighton 1973                   | Sin términos publicados                                                                                                                  |
| Gleason / grupos ISUP             | Gleason; Epstein 2016           | Sin términos publicados                                                                                                                  |
| Ferriman-Gallwey modificada       | Ferriman 1961; Hatch 1981       | Sin términos publicados                                                                                                                  |
| Reflejos osteotendinosos (0 a 5+) | El arquetipo no trae referencia | Graduación clínica genérica                                                                                                              |

### No incorporadas, con el motivo

| Instrumento                            | Motivo                                                                                                                                                                                                                                                                                                                | Evidencia                                               |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| **PHQ-9, GAD-7**                       | **Sin decisión de licencia del propietario.** El arquetipo `phq_9.v0` cita el permiso del sitio de los autores: «no permission is required to reproduce, translate, display or distribute them». El README del catálogo exige permiso escrito para uso comercial y `catalog.spec.ts` los prohíbe: no se cambió esa regla | `openEHR-EHR-OBSERVATION.phq_9.v0`, campo `copyright`   |
| Braden, Braden Q                       | © de los autores; «compliance with the terms established by the copyright owners»                                                                                                                                                                                                                                     | arquetipo, `copyright`                                  |
| Clinical Frailty Scale                 | © Rockwood 2005–2020                                                                                                                                                                                                                                                                                                  | arquetipo `clinical_frailty_scale2.v1`                  |
| Waterlow                               | © judy-waterlow.co.uk                                                                                                                                                                                                                                                                                                 | arquetipo `waterlow_score.v0`                           |
| MUST                                   | Ya prohibido por la regla del catálogo (`catalog.spec.ts`)                                                                                                                                                                                                                                                            | —                                                       |
| MST                                    | Permiso por Rightslink (Copyright Clearance Center)                                                                                                                                                                                                                                                                   | arquetipo `malnutrition_screening_tool.v1`, `copyright` |
| HoNOS                                  | © Royal College of Psychiatrists                                                                                                                                                                                                                                                                                      | arquetipo `honos.v0`                                    |
| Fagerström (FTND)                      | © Taylor & Francis                                                                                                                                                                                                                                                                                                    | arquetipo `fagerstrom.v0`                               |
| 6CIT, GUSS, EPIC, FACT-G, PROMIS, SOAS | Titular declarado en el arquetipo                                                                                                                                                                                                                                                                                     | arquetipos respectivos                                  |
| NEWS2                                  | © Royal College of Physicians; no se encontraron términos de uso                                                                                                                                                                                                                                                      | búsqueda web sin resultado                              |
| Berg, Caprini, GRACE, CRUSADE          | Licencia sin verificar                                                                                                                                                                                                                                                                                                | —                                                       |
| IPSS                                   | Dominio público según el arquetipo, pero es un cuestionario del paciente y la fuente no trae la versión validada en castellano                                                                                                                                                                                        | `ipss.v1`                                               |
| EPDS, K10, GPCOG                       | Psicométricos: exigen la versión validada en castellano, que la fuente no trae                                                                                                                                                                                                                                        | —                                                       |

## Hallazgos sobre lo que ya estaba

- **`build-forms.mjs --check` fallaba en `dev`** («PSIQ_AUDIT_TAMIZAJE: no tiene constructor v2»):
  las fichas SRQ-20 y AUDIT de v4.2.0 se escribieron a mano. El generador ahora las deja pasar sin
  tocarlas (`A_MANO`).
- **Dos fichas AUDIT para la misma condición**: `PSIQ_AUDIT_TAMIZAJE` (a mano) y
  `PSIQ_CTRL_ALCOHOL` («AUDIT completo»). Contradice «una ficha por enfermedad»; no se tocó.
- **Índice de Barthel** (ya en el catálogo): el arquetipo `modified_barthel_index.v0` anota que la
  Maryland State Medical Society tiene el copyright y que se usa «with permission». Conviene
  revisarlo con la misma regla que PHQ-9.
- **Cláusula no comercial**: todo el material OMS del catálogo —el de antes y el de ahora— es
  CC BY-NC-SA 3.0 IGO. Si AloVida es un producto comercial, el uso requiere el permiso que la OMS
  tramita en who.int/copyright.

## Defectos encontrados en las fuentes (corregidos y documentados en la ayuda del campo)

- `bishop_score.v0`: la estación fetal tiene invertidos los puntos de −3 y −2. Se usa −3 = 0, −2 = 1.
- `heart_score.v0`: la edad dice «≤65 years or older»; se tradujo «65 años o más».
- `charlson_comorbidity_index.v2`: la traducción al castellano dice «≥ años» (falta el 80) y lee
  «ni hepatitis crónica» en la hepatopatía leve.
- `nihss.v0`: el valor 2 del nivel de conciencia está truncado; se completó con la redacción del NINDS.
- `sofa_score.v0`: omite el criterio de dopamina > 15 µg/kg/min del puntaje cardiovascular 4.
- `diabetic_wound_wagner.v0`: la traducción es-AR trae «Pié», «fué», «subcutaneo», «osteomileitis».
- Validaciones que el propio generador encontró al escribir: ninguna opción repetida ni condición
  rota. Las pruebas nuevas encontraron campos propios sin referencia (reflejos, NIHSS) y tres
  campos de vacunación sin el descargo OMS: corregidos antes del PR.

## Huecos

- **NNAC de Bolivia, unidades 15 a 24, y normas 2025 del Ministerio de Salud y Deportes**: no se
  pudieron descargar (minsalud.gob.bo bloqueado por la red).
- **Guías nacionales y de sociedades** de la lista del brief (NICE, MINSAL, CENETEC, GuíaSalud,
  MinSalud Colombia, GINA, GOLD, KDIGO, ESC, ACOG, AAP, ADA) y WHO IMAI/IMCI en IRIS: bloqueadas.
- **DAK de la OMS sin repositorio público**: no se encontró DAK de tuberculosis, hipertensión, salud
  infantil (AIEPI), malaria, dengue ni salud mental.
- PHQ-9 y GAD-7: sin decisión de licencia (arriba).

## Sin revisión clínica

Toda traducción propia está marcada en la ayuda del campo como «no oficial» y no la revisó un
profesional. Las de mayor riesgo:

1. **NIHSS** (EMERG_ACV): no es la versión certificada en castellano. Para la certificación de
   evaluadores se usa la versión oficial.
2. Las listas de las DAK (puerperio, recién nacido, VIH, ITS, vacunación, planificación).
3. SOFA, HEART, Bishop y Charlson, por las correcciones al arquetipo.
4. Equivalencias de unidades de Child-Pugh (µmol/L ↔ mg/dL, g/L ↔ g/dL).

## Repositorio del modelo

**No requiere cambios para lo entregado**: todo entra en la estructura actual de fichas (campos,
opciones, `showWhen`, procedencia en `__catalog__`). Sin DDL, sin migraciones, sin `synchronize`.

Dos propuestas para `mantra-core-technologies/mantra-core-health-model`, ninguna bloqueante:

- `provenance` admite una sola fuente por ficha; las ampliadas citan las demás en `note` y en la
  ayuda de cada campo. Una tabla de procedencia por campo (fuente, versión, licencia, traducción
  propia sí/no) haría consultable lo que hoy es texto.
- La licencia «compartir igual» de los arquetipos y la «no comercial» de la OMS se aplican por
  campo, no por ficha: con procedencia por campo se podría filtrar lo que una instalación comercial
  puede mostrar.

## Verificación

| Comprobación                                              | Resultado                                                                                                                                                                                                                                                                                                                              |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `node tools/clinical-forms/build-forms.mjs --check`       | 374 fichas · 6 373 campos · 0 desactualizadas (en `dev` fallaba antes de este cambio)                                                                                                                                                                                                                                                  |
| `catalog.spec.ts` + `clinical-forms-seed.service.spec.ts` | 49 de 49 (5 pruebas nuevas de procedencia)                                                                                                                                                                                                                                                                                             |
| `corepack yarn typecheck`                                 | Sin errores (con `NODE_OPTIONS=--max-old-space-size=8192`: con el heap por defecto Node se queda sin memoria en este contenedor)                                                                                                                                                                                                       |
| `corepack yarn lint`                                      | Sin errores                                                                                                                                                                                                                                                                                                                            |
| `corepack yarn build`                                     | Sin errores; las fichas nuevas llegan a `dist/`                                                                                                                                                                                                                                                                                        |
| `src/common/seed` completo                                | 282 de 283: falla `glossary-articles.catalog.spec.ts`, que **también falla en `dev`** (piso de 2 000 palabras de un artículo del glosario), ajeno a este cambio                                                                                                                                                                        |
| Siembra real                                              | PostgreSQL 16 desechable con el DDL de `database/SQL` (`apply_all.sql` + `apply_deferred.sql`, sin errores). Primera corrida: 374 plantillas y 37 especialidades en 17 min 39 s; 6 747 definiciones de campo (6 373 + 374 campos reservados `__catalog__`). **Segunda corrida: 0 plantillas y 0 especialidades en 0,5 s: idempotente** |
| Subir de versión sobre una base de `dev`                  | No se corrió contra Postgres; lo cubre la prueba unitaria `al subir de versión actualiza la ficha de catálogo…` del spec de la siembra                                                                                                                                                                                                 |

## Cómo se reproduce

```bash
# 1. Fuentes (fuera del repo)
git clone --depth 1 https://github.com/openEHR/CKM-mirror /tmp/ckm-mirror
for r in smart-dak-pnc smart-hiv smart-fp smart-anc smart-immunizations; do
  git clone --depth 1 https://github.com/WorldHealthOrganization/$r /tmp/who/$r; done

# 2. Instantáneas versionadas
node tools/clinical-forms/openehr/extract-ckm.mjs /tmp/ckm-mirror
python3 -I tools/clinical-forms/who-dak/extract-dak.py /tmp/who        # requiere openpyxl

# 3. Fichas
node tools/clinical-forms/build-forms.mjs && node tools/clinical-forms/build-forms.mjs --check
```

El generador no necesita red: lee las instantáneas `ckm-snapshot.json` y `dak-snapshot.json`.
