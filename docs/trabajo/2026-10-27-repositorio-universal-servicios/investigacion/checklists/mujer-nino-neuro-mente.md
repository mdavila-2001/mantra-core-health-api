# Lista de control — Mujer, niño, neurología y salud mental (grupo `mujer-nino-neuro-mente`)

Fecha: 2026-10-27 · Datos: [`mujer-nino-neuro-mente.json`](./mujer-nino-neuro-mente.json)

## Para qué sirve

Esta lista de control reúne los servicios que un profesional de este grupo podría ofrecer en su tienda. Sirve para medir cuánto cubre el repositorio de referencia del que se importan los servicios. **Cada ítem cita al menos una fuente autorizada**, cotejada contra el documento descargado (código y texto). Si un servicio no tenía fuente, no entró en la lista. Los aranceles y las tarifas se usaron solo como prueba de que el servicio existe y de cómo se desglosa. Los precios no se copiaron.

## Resultado

«Hoy» es el número de servicios que la tabla «Cobertura final» de `docs/seed-research/specialty-services.md` ya asigna a la especialidad.

| Código | En el modelo | Hoy | Ítems | Con código equivalente | Con ≥ 2 fuentes | Solo en el arancel BO |
|---|---|---:|---:|---:|---:|---:|
| `GINECOLOGIA_OBSTETRICIA` | sí | 150 | 92 | 83 | 77 | 2 |
| `OBSTETRICIA` (obstetriz/matrona) | sí | 5 | 15 | 9 | 11 | 0 |
| `MEDICINA_MATERNO_FETAL` | sí | 2 | 24 | 23 | 14 | 0 |
| `ONCOLOGIA_GINECOLOGICA` | sí | 0 | 19 | 18 | 14 | 0 |
| `PEDIATRIA` | sí | 213 | 75 | 42 | 53 | 9 |
| `NEONATOLOGIA` | sí | 4 | 40 | 33 | 19 | 5 |
| `NEUROLOGIA` | sí | 77 | 53 | 50 | 39 | 2 |
| `NEUROLOGIA_PEDIATRICA` | sí | 64 | 29 | 28 | 15 | 11 |
| `ONCOLOGIA_PEDIATRICA` | sí | 3 | 21 | 21 | 9 | 9 |
| `INFECTOLOGIA_PEDIATRICA` | sí | 3 | 17 | 17 | 2 | 12 |
| `PSIQUIATRIA` | sí | 28 | 34 | 27 | 20 | 6 |
| `PSICOLOGIA_CLINICA` | sí | 15 | 46 | 31 | 19 | 0 |
| `MEDICINA_REPRODUCTIVA` | **falta** | — | 23 | 20 | 17 | 0 |
| `ENDOCRINOLOGIA_PEDIATRICA` | **falta** | — | 17 | 17 | 3 | 11 |
| `GASTROENTEROLOGIA_PEDIATRICA` | **falta** | — | 19 | 19 | 2 | 14 |
| `NEUMOLOGIA_PEDIATRICA` | **falta** | — | 19 | 19 | 3 | 13 |
| `NEFROLOGIA_PEDIATRICA` | **falta** | — | 16 | 16 | 1 | 12 |
| `PSIQUIATRIA_INFANTO_JUVENIL` | **falta** | — | 20 | 11 | 7 | 0 |
| `NEUROPSICOLOGIA` | **falta** | — | 9 | 5 | 3 | 0 |
| `FONOAUDIOLOGIA` | **falta** | — | 21 | 20 | 4 | 0 |
| `TERAPIA_OCUPACIONAL` | **falta** | — | 17 | 17 | 2 | 0 |
| **Total** | | | **626** | **526** | **334** | **106** |

Los códigos de las especialidades que faltan en el modelo son una **propuesta**: no existen en `VS_MEDICAL_SPECIALTY`.

«Hoy» y «Ítems» no se comparan uno a uno. Pediatría tiene hoy 213 servicios, pero 207 vienen del arancel de Santa Cruz y mezclan las subespecialidades pediátricas. En esta lista esas subespecialidades se separaron en sus propias especialidades, las marcadas como faltantes.

Distribución por categoría: 161 diagnósticos, 147 consultas, 131 procedimientos, 82 terapias, 40 quirúrgicos, 28 programas, 22 informes y 15 teleconsultas.

Códigos equivalentes en sistemas abiertos:

| Sistema | Códigos |
|---|---:|
| CUPS (Res. 2706/2025) | 313 |
| Arancel Colegio Médico SCZ 2025 (código interno del dataset) | 251 |
| FONASA MLE 2026 | 190 |
| MBS (Australia) | 147 |
| CIE-10-ES Procedimientos 2026 | 77 |

## Lo que la lista agrega a lo cargado hoy

- **Control prenatal por trimestre y ecografías por semana**: primera visita antes de la semana 12, controles del 2.º y 3.er trimestre y control de embarazo prolongado (SEGO, Tabla 1). Ecografía precoz, 11–13+6 con translucencia nucal, 12–16, morfológica 18–22, crecimiento 34–36 y gestación múltiple (SEGO, Tabla 3, y MBS 55700–55774, con los rangos de semana tomados del descriptor oficial).
- **Medicina materno-fetal**: estaba casi vacía (2 servicios). Ahora incluye amniocentesis, biopsia corial, cordocentesis, amniodrenaje, transfusión intrauterina, derivaciones fetales, láser placentario, oclusión traqueal fetal (FETO), neurosonografía y ecocardiografía fetal.
- **Oncología ginecológica**: tenía 0 servicios; ahora tiene 19, entre ellos traquelectomía e histerectomía radical, ganglio centinela, linfadenectomías, citorreducción y braquiterapia.
- **Niño sano por edad**: 14 visitas (3–5 días, 1, 2, 4, 6, 9, 12, 15, 18, 24 y 30 meses, 3, 4 y 5 años), más la edad escolar y la adolescencia. Las columnas salen de la tabla de periodicidad AAP/Bright Futures y los contenidos de la cartera del SNS (RD 1030/2006, anexo II, 6.1). También se agregan los cribados que tocan en cada visita: desarrollo, autismo, audición, visión, cadera, anemia, depresión materna y adolescente, y consumo de sustancias.
- **Vacunas**: 17 vacunas por antígeno (CUPS 9931xx/9935xx), cada una con su vía en CIE-10-ES PCS. Esa vía es intramuscular, subcutánea u oral; a BCG y polio no se les asignó vía.
- **Tamizaje neonatal**: el panel de la Orden SSI/2065/2014 se separa por enfermedad (hipotiroidismo congénito, fenilcetonuria, fibrosis quística, MCADD, LCHADD, acidemia glutárica I y anemia falciforme). Se suman galactosemia y biotinidasa (CUPS), las otoemisiones, los potenciales evocados auditivos automatizados, la oximetría para cardiopatía congénita crítica y la bilirrubina.
- **Neurofisiología granular**: EEG de vigilia, con privación de sueño y digital con mapeo, vídeo-EEG de 3–24 h, Holter EEG, estéreo-EEG, EMG con aguja, conducción nerviosa, onda F/reflejo H, fibra única, estimulación repetitiva y potenciales evocados (somatosensoriales, visuales, auditivos de tronco y motores). También Doppler transcraneal y punción lumbar. La toxina botulínica se separa por indicación (migraña crónica, distonía cervical, blefaroespasmo, espasmo hemifacial, espasticidad del adulto y parálisis cerebral, según los ítems MBS 18350–18379).
- **Psicoterapias por modalidad**: TCC, conductual, cognitiva, interpersonal, psicodinámica, de apoyo, psicoanálisis, hipnosis y biofeedback (con su código CIE-10-ES PCS GZ5x/GZ7x/GZH/GZF/GZC). Además DBT (NICE CG78), EMDR (nota MBS MN.7.4), terapia sistémica familiar, de pareja y grupal, entrenamiento a padres y relajación.
- **Evaluaciones psicométricas**: inteligencia, personalidad, escalas emocionales y conductuales, desarrollo y neuropsicológica (CUPS 9401–9407).
- **Informes, certificados y peritajes**: certificado e informe psiquiátrico, peritajes civil y penal, metapericia, capacidad laboral, informe psicológico y peritaje forense, e informe neurológico de incapacidad.
- **Teleconsulta** por especialidad, con los códigos FONASA 0108xxx y 0908xxx (telepsicología, telepareja), 0608xxx (terapia ocupacional) y 1308xxx (fonoaudiología).

## Las 5 fuentes más útiles

1. **CUPS — Resolución 2706 de 2025** (MinSalud Colombia): está en 277 ítems. Es la única fuente con consultas de primera vez, control e interconsulta por especialidad y subespecialidad pediátrica, incluso la nueva Infectología Pediátrica 890299/890399. También detalla la ecografía obstétrica por tipo, la medicina fetal invasiva, los potenciales evocados auditivos y las terapias de fonoaudiología y terapia ocupacional. <https://www.minsalud.gov.co/sites/rid/Lists/BibliotecaDigital/RIDE/DE/DIJ/resolucion-2706-de-2025.pdf>
2. **FONASA — Arancel MLE 2026** (Chile): está en 172 ítems. Tiene consulta y teleconsulta por especialidad, incluidas Medicina Materno Fetal, Ginecología Infanto-Juvenil, Neonatología y Psiquiatría Infanto-Juvenil. Trae el grupo 2502, que cubre fertilización asistida (inducción, aspiración folicular, laboratorio FIV/ICSI, transferencia, criopreservación y descongelación) y TEA por edad. Agrega los honorarios de matrona y la telerrehabilitación.
3. **MBS** (Australia): está en 126 ítems. Es la mejor fuente para la granularidad: ecografía obstétrica por rango de semanas, toxina botulínica por indicación, neurofisiología por número de nervios, psicoterapia individual o grupal por profesional y FIV por etapa.
4. **Programas formativos del BOE**: Obstetricia y Ginecología, Matrona, Pediatría, Neurología, Psicología Clínica, y Psiquiatría y Psiquiatría Infantil y de la Adolescencia (Orden PCM/205/2023). Son la única fuente para las competencias que no tienen código: neuropsicología, psicooncología, TCA, suelo pélvico, telepsiquiatría y EMT/TEC en adolescentes.
5. **Cartera común del SNS** (RD 1030/2006 y Orden SSI/2065/2014): da el contenido del control de niño sano y de la atención a la mujer. Lista el panel de cribado neonatal y las técnicas de reproducción asistida (IAC/IAD, FIV, ICSI, criopreservación, preservación de fertilidad, DGP y lavado seminal), y deja explícito qué psicoterapias excluye: psicoanálisis e hipnosis.

Complementan: SEGO (control prenatal por trimestre), AAP/Bright Futures (periodicidad pediátrica), CIE-10-ES Procedimientos 2026, el arancel del Colegio Médico de Santa Cruz y las tarifas públicas de Osakidetza 2026, ICS 2020, SAS 2024, SERGAS 2014 y Madrid 2023.

## Método y verificación

- FONASA y CUPS se leyeron de las mismas copias que usa el armado (`tools/terminology-import/specialty-services/SOURCES.md`). Sus SHA-256 coinciden: FONASA `b622019b…`, CUPS A `52b261eb…`. **Cada código CUPS citado se verificó en el PDF oficial de la Resolución 2706/2025** que bajó el otro agente (`/home/user/servicios-build/sources/co-cups-2026-res2706/`), y la página se cita en `ubicacion`. Tres códigos de internación neonatal (`108A01`, `105M01`, `120B01`) están en la copia pero **no** en la resolución de 2025. Por eso no se usaron.
- MBS: cada ítem se bajó de `www9.health.gov.au` el 2026-10-27. El descriptor citado sale de la página del ítem.
- BOE: los textos se bajaron por `diario_boe/xml.php` (BOE-A-2009-8882, -8881, -10107, BOE-A-2006-17999, -16212, BOE-A-2007-5033, BOE-A-2014-11444 y BOE-A-2023-5700). La `ubicacion` cita el apartado y la frase literal.
- Tarifas autonómicas: se leyeron de los PDF ya descargados en `servicios-build/sources/`, con página y línea literal.
- No se modificó nada fuera de este directorio.

## Advertencias

- **292 ítems tienen una sola fuente.** Entre ellos están los 106 que solo aparecen en el arancel de Santa Cruz (sobre todo subespecialidades pediátricas e infectología pediátrica). Ese arancel es OCR de un PDF escaneado: dos filas citadas llevan `ocrSospechoso` (consulta e informe de infectología pediátrica).
- **`OBSTETRICIA`** se interpretó como la profesión de obstetriz/matrona: FONASA asigna a la matrona los honorarios de preparto, parto y puerperio, y la fuente formativa es el programa de Matrona. Si en el modelo significa otra cosa, hay que revisar ese bloque.
- **DBT** se apoya solo en NICE CG78, y **EMDR** y **entrenamiento a padres** solo en la nota MBS MN.7.4. Ninguno tiene código propio en CUPS, FONASA ni PCS.
- El **psicoanálisis** y la **hipnosis** existen como modalidad (PCS GZ54/GZF), pero la cartera del SNS los excluye. Conviene marcarlos así si se importan.
- **Faltó evidencia autorizada verificable** (por eso no entraron): administración de antipsicóticos de depósito, Chagas congénito y seguimiento del recién nacido expuesto, cribado de retinopatía del prematuro, cervicometría y ADN fetal libre en sangre materna. Para el Chagas congénito sería útil el programa del Ministerio de Salud de Bolivia, pero su sitio no se consultó.
- **Calendario de vacunas**: la página 2026 del CAV-AEP redirige a una portada, así que no se citó. La vacunación se apoya en CUPS, CIE-10-ES PCS, AAP y la cartera del SNS.
