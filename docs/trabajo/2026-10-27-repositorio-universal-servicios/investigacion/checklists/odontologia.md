# Lista de control — Odontología (grupo `odontologia`)

Fecha: 2026-10-27 · Datos: [`odontologia.json`](./odontologia.json)

## Para qué sirve

Esta es una lista de control de los servicios odontológicos que un profesional podría ofrecer en su tienda. Sirve para medir cuánto cubre el repositorio de referencia del que se importan los servicios. **Cada ítem cita al menos una fuente autorizada.** Si un servicio no tenía fuente, no entró en la lista. La lista no incluye precios: los aranceles se usaron solo como prueba de que el servicio existe y de cómo se desglosa.

## Resultado

| Código | En el modelo | Ítems | Con código equivalente | Citados también por el arancel BO 2026 |
|---|---|---:|---:|---:|
| `ODONTOLOGIA` (general, preventiva, operatoria, programas) | sí | 61 | 33 | 15 |
| `ESTETICA_DENTAL` | sí | 19 | 5 | 3 |
| `ENDODONCIA` | sí | 69 | 52 | 17 |
| `PERIODONCIA` (incluye periimplantitis) | sí | 48 | 32 | 11 |
| `ORTODONCIA` | sí | 48 | 33 | 0 |
| `REHABILITACION_ORAL` (prótesis fija, removible y maxilofacial) | sí | 91 | 57 | 29 |
| `IMPLANTOLOGIA_ORAL` | sí | 53 | 25 | 0 |
| `CIRUGIA_BUCOMAXILOFACIAL` (cirugía bucal ambulatoria) | sí | 61 | 49 | 8 |
| `CIRUGIA_ORAL_MAXILOFACIAL` (cirugía hospitalaria) | sí | 48 | 43 | 0 |
| `ODONTOPEDIATRIA` | sí | 44 | 30 | 13 |
| `ARMONIZACION_OROFACIAL` | sí | 17 | 5 | 0 |
| `RADIOLOGIA_ORAL_MAXILOFACIAL` | **falta** | 36 | 25 | 3 |
| `ESTOMATOLOGIA_PATOLOGIA_ORAL` | **falta** | 35 | 19 | 1 |
| `TTM_DOLOR_OROFACIAL` | **falta** | 34 | 8 | 2 |
| `ODONTOLOGIA_DEL_SUENO` | **falta** | 8 | 1 | 0 |
| `GERODONTOLOGIA` | **falta** | 12 | 1 | 0 |
| `ODONTOLOGIA_PACIENTES_ESPECIALES` | **falta** | 16 | 5 | 0 |
| `ODONTOLOGIA_LEGAL_FORENSE` (extra, no pedido) | **falta** | 5 | 0 | 0 |
| **Total** | | **705** | **423** | **102** |

Los códigos de las especialidades que faltan en el modelo son una **propuesta**: no existen en `VS_MEDICAL_SPECIALTY`. Odontología legal y forense se agregó porque la Universidad de Chile la ofrece como servicio con aranceles propios (pericias, informes de lesiones).

Distribución por categoría: 345 procedimientos, 168 quirúrgicos, 65 diagnósticos, 54 consultas, 38 programas, 26 terapias, 8 informes y 1 teleconsulta.

Códigos equivalentes en sistemas abiertos:

| Sistema | Códigos |
|---|---:|
| CUPS (Colombia) | 437 |
| Nomenclador Nacional Odontológico (Argentina) | 31 |
| CIE-10-ES Procedimientos | 24 |
| FONASA MLE | 18 |

## Fuentes, por número de ítems que cada una respalda

1. **CUPS Colombia**, dataset oficial «Procedimiento del PBS» de MinSalud en datos.gov.co (389 ítems). Es la más granular en procedimientos con código: exodoncias por número de raíces, terapia de conducto uni/bi/multirradicular, consultas por especialidad, radiografías periapicales por zona y cirugía maxilofacial. El archivo local es `/home/user/servicios-build/sources/co-minsalud-pbs-procedimientos/`, descargado por el otro agente; aquí no se volvió a descargar.
2. **Universidad de Chile, Facultad de Odontología — Aranceles 2024** (315 + 142 ítems). Es la fuente más amplia por especialidad e incluye las especialidades que faltan en el modelo: TTM y dolor orofacial, dispositivo de avance mandibular, medicina oral, anatomía patológica, microbiología oral, radiología con CBCT, prótesis maxilofacial, cuidados especiales (NANEAS), clínica del bebé, traumatología dentoalveolar, armonización orofacial (toxina, ácido hialurónico, hilos, bioestimuladores) y pericias.
3. **Universidad de Salamanca — Tarifas de la Clínica Odontológica**, acuerdo del Consejo Social del 20-06-2023 (125 ítems). Incluye ortodoncia (alineadores, lingual, brackets estéticos, disyuntor osteosoportado, miniplacas), implantoprótesis y sedación endovenosa.
4. **Arancel odontológico Bolivia 2026**, ya cargado en el repo (102 ítems). Sirve de base local. La mayor parte de esta lista no figura en él.
5. **Universidad de Granada — Máster de Odontología Multidisciplinar Estética** (76 ítems) **y Máster de Endodoncia** (11 ítems). Aportan el detalle estético y protésico: carillas por material, table top, endocorona, BOPT, coronas de zirconio monolítico y de disilicato, elevación de seno abierta frente a cerrada, sobredentaduras de 2, 3 y 4 implantes.

Otras fuentes usadas:

- **Nomenclador CORA / Nomenclador Nacional (Argentina)**, a través de circulares de FOPBA; también aporta los códigos `NNO-AR`.
- **OSEP Mendoza**, Resolución 462/2025.
- **Normas españolas:** RD 1030/2006, Anexo II §9 (cartera común bucodental, consolidada a 2025); PADI de la Comunidad de Madrid 2024; Orden SCO/2753/2007, programa oficial de Cirugía Oral y Maxilofacial, con su lista de intervenciones.
- **Chile:** FONASA MLE 2026; GES (Superintendencia de Salud y MINSAL).
- **Brasil:** CFO, Resolución 198/2019 sobre armonización orofacial.
- **Sociedades y guías:** AEDE (consentimientos y protocolos); SECIB (guía de terceros molares y folleto de cáncer bucal); guía S3 de la EFP en la traducción de SEPA; SEMO y SEGER (boca seca); guía del Consejo General de Dentistas, la FDE y SEOENE sobre discapacidad, y páginas de SEOENE.
- **Sueño:** informe de OSTEBA sobre dispositivos de avance mandibular (red de agencias de evaluación del Ministerio de Sanidad) y documento internacional de consenso sobre AOS (Arch Bronconeumol 2022).
- **Gerodontología:** guía docente de la UGR.
- **Implantes cigomáticos:** Revista Mexicana de Cirugía Bucal y Maxilofacial.

Todas las URL están en `fuentes` dentro del JSON y en cada evidencia.

## Notas de calidad

- **CUPS con sufijo «SOD».** En el dataset PBS, 39 códigos del catálogo completo aparecen con terminación `…00 SOD`. Por ejemplo, `231101` → `231100 EXODONCIA QUIRÚRGICA UNIRRADICULAR SOD`. Se usó el código del PBS y se guardó el original en `codigoCatalogoCompleto`.
- **CUPS no verificados.** `237203` (recubrimiento pulpar directo) y `237204` (indirecto) están en el catálogo CUPS que se proporcionó en la sesión, pero no en el dataset PBS. Quedan marcados con `nota` y no se usan como evidencia; esos dos ítems se sostienen en otras fuentes.
- **Equivalentes aproximados.** Llevan `aproximado: true`; por ejemplo, el retratamiento endodóntico frente a `237307 DESOBTURACIÓN`. No cuentan como evidencia.
- **CIE-10-ES PCS.** Solo se anotaron códigos que coinciden de verdad con el servicio: extracción `0CDWXZ0`, reimplantación `0CMWXZ0`, reposición `0CSWXZ0`, suplemento óseo maxilar `0NUR0KZ` o `0NUR07Z`, imagen `BN0G/BN0H/BN0J/BN09/BN29/BN25` y similares. Se validaron contra la tabla de 2026.
- **FONASA.** El arancel MLE no tiene grupo dental (el grupo 27 es de la Modalidad Institucional y no estaba accesible). Solo se usaron consultas, teleconsultas y procedimientos de cirugía maxilofacial y bucal de los grupos 01, 04, 13, 14 y 21.

## Huecos y decisiones pendientes

1. **Duplicado `CIRUGIA_BUCOMAXILOFACIAL` / `CIRUGIA_ORAL_MAXILOFACIAL`.** Se propone separarlos así:
   - **Bucomaxilofacial:** cirugía bucal ambulatoria hecha por el dentista (exodoncias, cordales, quistes, frenectomías, cirugía preprotésica).
   - **Oral y maxilofacial:** el ámbito hospitalario de la especialidad médica según la Orden SCO/2753/2007 (ortognática, fracturas, ATM quirúrgica, oncología, fisuras).

   Es una propuesta y queda pendiente de decisión.
2. **Sin fuente autorizada, no incluidos:** brackets de zafiro y autoligado (la USAL solo dice «baja fricción»), teleconsulta odontológica (solo existe la de cirugía maxilofacial en FONASA), joyas dentales y el baremo del Consejo General de Dentistas, que no es público.
3. **No accesibles desde esta sesión:** sepa.es, odontologiapediatrica.com (SEOP), secom.org (falló la conexión), las páginas de pacientes de SEDO (no listan tratamientos), MUFACE (solo fuentes secundarias), la Modalidad Institucional de FONASA y el arancel de IAPOS Santa Fe (error de certificado y 503). Merece la pena intentarlo de nuevo.
4. **Especialidades que faltan en el modelo:** Radiología oral y maxilofacial, Estomatología y patología oral, TTM y dolor orofacial, Odontología del sueño, Gerodontología, Pacientes especiales y Odontología legal. Juntas suman 146 ítems con fuente que hoy no tienen dónde colgarse.

## Cómo se generó

Los scripts de construcción están en el scratchpad de la sesión: `gen_sources.py`, `gen_items_[a-e].py` y `build.py`. El script `build.py` valida cada código contra el CSV de CUPS PBS, la tabla de CIE-10-ES 2026 y los datos de FONASA MLE 2026, descarta los códigos inexistentes y añade como evidencia la descripción oficial de CUPS cuando la equivalencia es exacta.
