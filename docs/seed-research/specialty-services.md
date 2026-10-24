# Servicios médicos por especialidad — registro de investigación

- Fecha: 2026-10-24 · Rama: `claude/festive-goldberg-wq7o2f` (pedida como `justin/seed-specialty-services`; ver «Desvíos» en el reporte de trabajo)
- Importador: `tools/terminology-import/specialty-services/` · Reglas: `src/common/seed/data/specialty-services/`
- Pedido: «por cada especialidad, todos y cada uno de los posibles servicios existentes de la práctica médica».

## Punto de partida (paso 0)

| Qué | Dónde | Estado al empezar |
|---|---|---|
| Especialidades | `VS_MEDICAL_SPECIALTY`, paquete de seeds del modelo (`03_terminology.seeds.json`, commit `eceb98f2`) | **63** especialidades (el comentario de `MedicalSpecialtyCatalogService` todavía dice 36: el modelo sumó 27 después) |
| Catálogo de servicios de la práctica | `billing.service_catalog` (FT-22, carril 22) | Por práctica; nace con «Cita médica» (`CITA_MEDICA`). Se puede colgar de un concepto por `service_concept_id`. |
| Nomenclador importable (carril 23 / FX-6) | `VS_BO_MEDICAL_PROCEDURE`: Arancel de Honorarios Médicos SCZ 2025 (4 295) + arancel odontológico 2026 (113) | Cada procedimiento tiene la propiedad `procedure:specialty` en **texto libre**, sin enlace a `VS_MEDICAL_SPECIALTY`. |
| Relación especialidad → servicio | — | **No existía.** `concept_relationships` vacío para esto. |

La relación se escribe en tablas existentes (sin DDL): `concept_relationships`
servicio → especialidad con el tipo `REL_SPECIALTY` que la API ya siembra
(«el origen lo atiende la especialidad destino»), la evidencia de cada relación
en la propiedad `specialty-service:evidence`, y un value set por especialidad
(`VS_SPECIALTY_SERVICES_<CÓDIGO>`) que ya lee el endpoint público
`GET /terminology/value-sets/:id/$expand?includeProperties=true`.

## Restricción de red (determina todo lo que sigue)

La sesión sólo podía salir a **GitHub** (raw y `git clone`) y a los registros
**npm/PyPI**. Todos los sitios oficiales (fonasa.gob.cl, sispro.gov.co,
minsalud.gov.co, minsalud.gob.bo, boe.es, who.int, datos.gob.ar, infoleg,
sanidad.gob.es…) respondían `connect_rejected`; también la herramienta de
lectura web (DNS). La búsqueda web sí funcionaba (sólo resultados). Por eso
«imposible encontrar más» acá significa **imposible con fuentes alcanzables y
verificables desde esta red**, no en todo internet: la sección «Huecos» dice qué
haría falta para seguir.

## Pasadas

Conteo «nuevos»: servicios (código de una fuente) que la pasada suma a cada
especialidad. No se deduplica **entre** nomencladores porque eso exigiría un
mapeo CUPS↔FONASA↔arancel que ninguna fuente publica; la columna «nombres
distintos» de la cobertura es la única deduplicación honesta posible (texto
normalizado idéntico).

### Pasada 1 — fuentes ya en el repo (Bolivia)

- Fuentes: Arancel de Honorarios Médicos, Colegio Médico de Santa Cruz, julio
  2025 (35 encabezados de especialidad); Listado arancel odontológico 2026.
- Método: encabezado de especialidad del arancel → código del modelo (tabla
  `boArancelHeadings` / `boDentalSections` de `rules.json`).
- Resultado: **3 695** servicios relacionados (3 582 médicos + 113
  odontológicos), 3 772 relaciones, en 34 especialidades. 713 filas quedan sin especialidad del
  modelo (Neurocirugía 266, Cirugía Plástica 205, Cirugía Cardíaca/Torácica/
  Vascular 192, Mastología 36, Salud Pública 10, Auditoría Médica 4).
- Por especialidad: columna «Arancel BO» de la cobertura.

### Pasada 2 — FONASA MLE 2026 (Chile)

- Fuente: Arancel FONASA MLE 2026, 2 515 prestaciones, copia npm verificada
  596/596 contra el PDF oficial del repo.
- Método: (a) grupo cuyo título oficial nombra **una** especialidad del modelo
  (04, 08, 12, 13, 16, 18, 20, 21, 22); (b) descriptor que nombra al prestador
  («consulta médica de especialidad en …», «psicólogo clínico», «matrona»,
  «kinesiológica»…). Grupos combinados (09, 11, 17, 19) sólo por descriptor.
  Grupo 03 (laboratorio, 443) excluido: lo cubre la sesión de análisis.
- Resultado: **962** servicios nuevos, 965 relaciones (878 por grupo, 87 por
  descriptor). 209 sin especialidad del modelo (grupos 05, 14 y 15 = 169; más 40
  descriptores con 17 frases distintas).
- Especialidades que esta pasada abre desde cero: Neumología, Infectología,
  Geriatría, Medicina Familiar, Obstetricia, Medicina Materno Fetal,
  Neonatología, Enfermería, Nutrición, Fisioterapia, Psicología Clínica.

### Pasada 3 — CUPS (Colombia)

- Fuente: CUPS, cruce de dos copias (7 085 coinciden, 2 716 sólo en A).
- Método: descriptor con prestador («… por especialista en …», «… por
  psicología», «interconsulta por …», «psicoterapia … por psiquiatría»).
  CUPS no agrupa por especialidad, así que no hay asignación por sección.
- Resultado: **186** servicios nuevos (174 con dos copias, 12 de una sola),
  186 relaciones. Abre desde cero: Cardiología Pediátrica, Infectología
  Pediátrica, Oncología Pediátrica, Ortopedia Pediátrica, Cirugía Oncológica,
  Medicina Deportiva, Ortodoncia. 184 descriptores (55 frases distintas)
  nombran especialidades o profesiones que el modelo no tiene.

### Pasada 3b — barrido de frases de prestador sin regla

- Fuente: las mismas (FONASA, CUPS), buscando toda frase «POR …», «DE …» y
  sustantivo de profesión que las reglas no cubrían.
- Resultado: +12 servicios (kinesiología → Fisioterapia, matrona → Obstetricia,
  odontología, higiene oral…) y 15 frases nuevas registradas como hueco:
  profesiones (fonoaudiología, terapia ocupacional, terapia respiratoria,
  trabajo social, optometría, higiene oral…) y frases genéricas que no nombran
  especialidad («otras especialidades médicas», «equipo interdisciplinario»). Tras esto el corpus no tiene **ninguna** frase sin regla
  (`unmatched = 0`).

### Pasada 4 — otros nomencladores en castellano (Argentina, Perú, Ecuador, México)

- Fuentes probadas: Nomenclador PAMI (copia npm `nomenclador-salud-js`),
  Nomenclador HPGD (`cluster311/nhpgd`), CPMS Perú, tarifario de Ecuador,
  catálogos DGIS de México, nomencladores provinciales y de sociedades (FASGO,
  AAC), búsqueda de nomencladores por especialidad en GitHub.
- Resultado: **0 nuevos.** PAMI: licencia no verificable; HPGD: los datos están
  en una planilla de Google (bloqueada); CPMS y Ecuador: derivados de CPT;
  DGIS/FASGO/AAC/provinciales: sitios bloqueados o PDF sin copia alcanzable.

### Pasada 5 — clasificaciones internacionales y currículos

- Fuentes probadas: WHO ICHI, ICD-10-PCS, CIE-10-ES Procedimientos, CIE-9-MC,
  SIGTAP (Brasil), ACGME / ACGME-I case logs, UEMS, programas formativos del BOE.
- Resultado: **0 nuevos.** ICHI, ICD-10-PCS, CIE-10-ES y CIE-9-MC no tienen eje
  por especialidad (relacionarlos sería inferir); SIGTAP está en portugués sin
  traducción oficial; ACGME/UEMS en inglés, organizados por CPT y bloqueados;
  BOE bloqueado y en prosa.

**Corte:** dos pasadas seguidas (4 y 5) sin aportes para **ninguna**
especialidad. Se detiene acá por el protocolo, con la salvedad de red de arriba.

## Cobertura final

Corpus: **4 843** servicios, **4 923** relaciones servicio → especialidad, en
**52** de las 63 especialidades. Carga medida en un Postgres desechable (ver
reporte): 1 148 conceptos nuevos (FONASA + CUPS), 1 148 designaciones, 7 139
propiedades, 4 923 relaciones, 52 value sets con 4 923 miembros, 3 lotes; la
segunda corrida inserta 0.

| Especialidad | Código | Servicios | FONASA | CUPS | Arancel BO | Nombres distintos |
|---|---|---:|---:|---:|---:|---:|
| Medicina General | `MEDICINA_GENERAL` | 25 | 2 | 10 | 13 | 25 |
| Medicina Familiar | `MEDICINA_FAMILIAR` | 6 | 2 | 4 | 0 | 6 |
| Medicina Interna | `MEDICINA_INTERNA` | 50 | 2 | 3 | 45 | 50 |
| Pediatría | `PEDIATRIA` | 213 | 2 | 4 | 207 | 213 |
| Ginecología y Obstetricia | `GINECOLOGIA_OBSTETRICIA` | 150 | 68 | 4 | 78 | 147 |
| Cardiología | `CARDIOLOGIA` | 104 | 3 | 3 | 98 | 104 |
| Neurología | `NEUROLOGIA` | 77 | 2 | 3 | 72 | 77 |
| Dermatología | `DERMATOLOGIA` | 154 | 41 | 3 | 110 | 154 |
| Endocrinología | `ENDOCRINOLOGIA` | 26 | 2 | 3 | 21 | 26 |
| Gastroenterología | `GASTROENTEROLOGIA` | 219 | 159 | 3 | 57 | 219 |
| Neumología | `NEUMOLOGIA` | 5 | 2 | 3 | 0 | 5 |
| Nefrología | `NEFROLOGIA` | 151 | 4 | 3 | 144 | 150 |
| Urología | `UROLOGIA` | 182 | 2 | 3 | 177 | 181 |
| Traumatología y Ortopedia | `TRAUMATOLOGIA` | 1135 | 223 | 4 | 908 | 1133 |
| Cirugía General | `CIRUGIA_GENERAL` | 325 | 2 | 4 | 319 | 323 |
| Oftalmología | `OFTALMOLOGIA` | 277 | 117 | 3 | 157 | 276 |
| Otorrinolaringología | `OTORRINOLARINGOLOGIA` | 359 | 116 | 3 | 240 | 353 |
| Psiquiatría | `PSIQUIATRIA` | 28 | 2 | 9 | 17 | 28 |
| Psicología Clínica | `PSICOLOGIA_CLINICA` | 15 | 2 | 13 | 0 | 15 |
| Oncología | `ONCOLOGIA` | 178 | 2 | 3 | 173 | 173 |
| Hematología | `HEMATOLOGIA` | 9 | 2 | 3 | 4 | 9 |
| Reumatología | `REUMATOLOGIA` | 27 | 2 | 3 | 22 | 27 |
| Infectología | `INFECTOLOGIA` | 5 | 2 | 3 | 0 | 5 |
| Geriatría | `GERIATRIA` | 5 | 2 | 3 | 0 | 5 |
| Anestesiología | `ANESTESIOLOGIA` | 21 | 4 | 3 | 14 | 21 |
| Radiología e Imagenología | `RADIOLOGIA` | 287 | 153 | 3 | 131 | 281 |
| Patología Clínica | `PATOLOGIA_CLINICA` | 0 | 0 | 0 | 0 | 0 |
| Medicina de Emergencia | `MEDICINA_EMERGENCIA` | 50 | 1 | 1 | 48 | 50 |
| Medicina Intensiva | `MEDICINA_INTENSIVA` | 42 | 0 | 0 | 42 | 42 |
| Nutrición y Dietética | `NUTRICION` | 9 | 2 | 7 | 0 | 9 |
| Odontología | `ODONTOLOGIA` | 123 | 1 | 9 | 113 | 120 |
| Fisioterapia y Rehabilitación | `FISIOTERAPIA` | 13 | 7 | 6 | 0 | 13 |
| Enfermería | `ENFERMERIA` | 13 | 5 | 8 | 0 | 13 |
| Bioquímica Clínica | `BIOQUIMICA_CLINICA` | 0 | 0 | 0 | 0 | 0 |
| Obstetricia | `OBSTETRICIA` | 5 | 5 | 0 | 0 | 5 |
| Medicina Deportiva | `MEDICINA_DEPORTIVA` | 3 | 0 | 3 | 0 | 3 |
| Anatomía Patológica | `ANATOMIA_PATOLOGICA` | 27 | 13 | 0 | 14 | 27 |
| Cirugía Bucomaxilofacial | `CIRUGIA_BUCOMAXILOFACIAL` | 0 | 0 | 0 | 0 | 0 |
| Cirugía Pediátrica | `CIRUGIA_PEDIATRICA` | 225 | 2 | 3 | 220 | 225 |
| Medicina del Trabajo | `MEDICINA_DEL_TRABAJO` | 0 | 0 | 0 | 0 | 0 |
| Medicina Física y Rehabilitación | `MEDICINA_FISICA_REHABILITACION` | 50 | 2 | 3 | 45 | 49 |
| Salud Familiar Comunitaria Intercultural | `SALUD_FAMILIAR_COMUNITARIA_INTERCULTURAL` | 0 | 0 | 0 | 0 | 0 |
| Cirugía Oncológica | `CIRUGIA_ONCOLOGICA` | 3 | 0 | 3 | 0 | 3 |
| Coloproctología | `COLOPROCTOLOGIA` | 50 | 2 | 3 | 45 | 50 |
| Cardiología Pediátrica | `CARDIOLOGIA_PEDIATRICA` | 3 | 0 | 3 | 0 | 3 |
| Infectología Pediátrica | `INFECTOLOGIA_PEDIATRICA` | 3 | 0 | 3 | 0 | 3 |
| Medicina del Dolor | `MEDICINA_DEL_DOLOR` | 0 | 0 | 0 | 0 | 0 |
| Medicina Materno Fetal | `MEDICINA_MATERNO_FETAL` | 2 | 2 | 0 | 0 | 2 |
| Neonatología | `NEONATOLOGIA` | 4 | 1 | 3 | 0 | 4 |
| Neurología Pediátrica | `NEUROLOGIA_PEDIATRICA` | 64 | 2 | 3 | 59 | 64 |
| Oncología Ginecológica | `ONCOLOGIA_GINECOLOGICA` | 0 | 0 | 0 | 0 | 0 |
| Oncología Pediátrica | `ONCOLOGIA_PEDIATRICA` | 3 | 0 | 3 | 0 | 3 |
| Ortopedia Pediátrica | `ORTOPEDIA_PEDIATRICA` | 4 | 0 | 4 | 0 | 4 |
| Terapia Intensiva Pediátrica | `TERAPIA_INTENSIVA_PEDIATRICA` | 102 | 0 | 0 | 102 | 102 |
| Endodoncia | `ENDODONCIA` | 17 | 0 | 3 | 14 | 17 |
| Ortodoncia | `ORTODONCIA` | 3 | 0 | 3 | 0 | 3 |
| Periodoncia | `PERIODONCIA` | 21 | 0 | 3 | 18 | 21 |
| Estética Dental | `ESTETICA_DENTAL` | 0 | 0 | 0 | 0 | 0 |
| Rehabilitación Oral | `REHABILITACION_ORAL` | 34 | 0 | 3 | 31 | 34 |
| Cirugía Oral y Maxilofacial | `CIRUGIA_ORAL_MAXILOFACIAL` | 0 | 0 | 0 | 0 | 0 |
| Odontopediatría | `ODONTOPEDIATRIA` | 17 | 0 | 3 | 14 | 17 |
| Implantología Oral | `IMPLANTOLOGIA_ORAL` | 0 | 0 | 0 | 0 | 0 |
| Armonización Orofacial | `ARMONIZACION_OROFACIAL` | 0 | 0 | 0 | 0 | 0 |

### Especialidades sin servicios, y por qué

| Especialidad | Motivo |
|---|---|
| Patología Clínica, Bioquímica Clínica | Sus servicios son análisis de laboratorio: los cubre la sesión de análisis (FONASA grupo 03 excluido a propósito). |
| Medicina del Trabajo | CUPS 890262/890362/890462: las dos copias se contradicen (la B trunca el nombre). Con la copia oficial entrarían 3. |
| Medicina del Dolor | Ninguna fuente alcanzable la nombra sola; CUPS dice «Dolor y cuidados paliativos» (más amplia) y no se asimila. |
| Salud Familiar Comunitaria Intercultural | Es boliviana; CUPS dice «Salud familiar y comunitaria» (sin el componente intercultural) y no se asimila. |
| Cirugía Bucomaxilofacial, Cirugía Oral y Maxilofacial | El modelo tiene **dos** códigos para lo mismo; las fuentes dicen «Cirugía maxilofacial» / «Cirugía oral»; elegir uno sería inventar. |
| Oncología Ginecológica, Estética Dental, Implantología Oral, Armonización Orofacial | Ninguna fuente alcanzable las nombra. |

## Huecos

### Especialidades y profesiones que las fuentes nombran y el modelo no tiene

Propuesta para `mantra-core-health-model` (agregar a `VS_MEDICAL_SPECIALTY`;
al cargarlas, re-correr el importador relaciona estos servicios sin tocar código):

| Fuente | Sección o frase de la fuente | Servicios sin especialidad del modelo | Motivo |
|---|---|---:|---|
| Arancel SCZ | Neurocirugía | 266 | Falta Neurocirugía en el modelo. |
| Arancel SCZ | Cirugía Plástica, Estética y Reconstructiva | 205 | Falta Cirugía Plástica en el modelo. |
| Arancel SCZ | Cirugía Cardíaca, Torácica y Vascular | 192 | Falta Cirugía Cardiovascular y de Tórax en el modelo. |
| FONASA | Grupo 15 · Cirugía plástica y reparadora | 66 | Falta en el modelo. |
| FONASA | Grupo 14 · Cirugía de cabeza y cuello | 60 | Falta en el modelo. |
| FONASA | Grupo 05 · Medicina nuclear y radioterapia | 43 | Falta Medicina Nuclear / Radioterapia en el modelo. |
| Arancel SCZ | Mastología | 36 | Falta Mastología en el modelo. |
| CUPS | EQUIPO INTERDISCIPLINARIO | 13 | No es una especialidad. |
| Arancel SCZ | Salud Pública | 10 | Falta Salud Pública en el modelo; además arancela consultorías, no atención. |
| CUPS | TRABAJO SOCIAL | 8 | Profesión que el modelo no tiene. |
| CUPS | TERAPIA OCUPACIONAL | 8 | Profesión que el modelo no tiene. |
| FONASA | TERAPIA OCUPACIONAL | 6 | Profesión que el modelo no tiene. |
| CUPS | TERAPIA RESPIRATORIA | 5 | Profesión que el modelo no tiene. |
| FONASA | FONOAUDIOLOGO | 4 | Profesión que el modelo no tiene. |
| CUPS | MEDICINA ESPECIALIZADA | 4 | No nombra la especialidad. |
| CUPS | OTRAS ESPECIALIDADES MEDICAS | 4 | No nombra la especialidad. |
| Arancel SCZ | Auditoría Médica | 4 | VS_MEDICAL_SPECIALTY no tiene Auditoría Médica. |
| CUPS | FONIATRIA Y FONOAUDIOLOGIA | 3 | Profesión que el modelo no tiene. |
| CUPS | OTRAS ESPECIALIDADES EN ODONTOLOGIA | 3 | No nombra la especialidad. |
| CUPS | FONOAUDIOLOGIA | 3 | Profesión que el modelo no tiene. |
| CUPS | SALUD FAMILIAR Y COMUNITARIA | 3 | No es SALUD_FAMILIAR_COMUNITARIA_INTERCULTURAL (la SAFCI boliviana incluye el componente intercultural): no se asimila. |
| CUPS | CIRUGIA ORAL | 3 | Idem: no coincide con ninguna de las dos del modelo. |
| CUPS | ESTOMATOLOGIA Y CIRUGIA ORAL | 3 | Idem. |
| CUPS | RADIOLOGIA ORAL Y MAXILOFACIAL | 3 | Falta en el modelo. |
| CUPS | ALERGOLOGIA | 3 | Falta en el modelo. |
| CUPS | ANESTESIOLOGIA CARDIOVASCULAR | 3 | Subespecialidad sin código en el modelo. |
| CUPS | CIRUGIA CARDIOVASCULAR | 3 | Falta en el modelo. |
| CUPS | CIRUGIA DE CABEZA Y CUELLO | 3 | Falta en el modelo. |
| CUPS | CIRUGIA DE MAMA Y TUMORES DE TEJIDOS BLANDOS | 3 | Falta en el modelo. |
| CUPS | CIRUGIA DE TORAX | 3 | Falta en el modelo. |
| CUPS | CIRUGIA GASTROINTESTINAL | 3 | Falta en el modelo. |
| CUPS | CIRUGIA MAXILOFACIAL | 3 | El modelo tiene CIRUGIA_BUCOMAXILOFACIAL y CIRUGIA_ORAL_MAXILOFACIAL; ninguna lleva este nombre exacto y elegir una sería inventar. |
| CUPS | CIRUGIA PLASTICA, ESTETICA Y RECONSTRUCTIVA | 3 | Falta en el modelo. |
| CUPS | CIRUGIA VASCULAR | 3 | Falta en el modelo. |
| CUPS | DOLOR Y CUIDADOS PALIATIVOS | 3 | Más amplia que MEDICINA_DEL_DOLOR (incluye paliativos): no se asimila. |
| CUPS | ENDOCRINOLOGIA PEDIATRICA | 3 | Falta en el modelo. |
| CUPS | GASTROENTEROLOGIA PEDIATRICA | 3 | Falta en el modelo. |
| CUPS | GENETICA MEDICA | 3 | Falta en el modelo. |
| CUPS | HEMATOLOGIA PEDIATRICA | 3 | Falta en el modelo. |
| CUPS | HEPATOLOGIA | 3 | Falta en el modelo. |
| CUPS | MASTOLOGIA | 3 | Falta en el modelo. |
| CUPS | MEDICINA AEROESPACIAL | 3 | Falta en el modelo. |
| CUPS | MEDICINA ALTERNATIVA (AYURVEDA) | 3 | — |
| CUPS | MEDICINA ALTERNATIVA (HOMEOPATICA) | 3 | — |
| CUPS | MEDICINA ALTERNATIVA (MEDICINA TRADICIONAL CHINA) | 3 | — |
| CUPS | MEDICINA ALTERNATIVA (NATUROPATIA) | 3 | — |
| CUPS | MEDICINA FORENSE | 3 | Falta en el modelo. |
| CUPS | MEDICINA NUCLEAR | 3 | Falta en el modelo. |
| CUPS | NEFROLOGIA PEDIATRICA | 3 | Falta en el modelo. |
| CUPS | NEUMOLOGIA PEDIATRICA | 3 | Falta en el modelo. |
| CUPS | NEUROCIRUGIA | 3 | Falta en el modelo. |
| CUPS | ONCOHEMATOLOGIA PEDIATRICA | 3 | Falta en el modelo. |
| CUPS | PSIQUIATRIA PEDIATRICA | 3 | Falta en el modelo. |
| CUPS | RADIOTERAPIA | 3 | Falta en el modelo. |
| CUPS | REUMATOLOGIA PEDIATRICA | 3 | Falta en el modelo. |
| CUPS | SEXOLOGIA CLINICA | 3 | Falta en el modelo. |
| CUPS | TOXICOLOGIA CLINICA | 3 | Falta en el modelo. |
| CUPS | TRASPLANTES | 3 | Falta en el modelo. |
| CUPS | MEDICINA ALTERNATIVA (OSTEOPATICA) | 3 | — |
| CUPS | MEDICINA ALTERNATIVA (NEURALTERAPEUTICA) | 3 | — |
| CUPS | MEDICINA ESTETICA | 3 | Falta en el modelo. |
| FONASA | NEUROCIRUGIA | 2 | Falta en el modelo. |
| FONASA | ENDOCRINOLOGIA PEDIATRICA | 2 | Falta en el modelo. |
| FONASA | PSIQUIATRIA PEDIATRICA Y DE LA ADOLESCENCIA | 2 | Falta en el modelo. |
| FONASA | INMUNOLOGIA | 2 | Falta en el modelo. |
| FONASA | CIRUGIA DE CABEZA, CUELLO Y MAXILOFACIAL | 2 | Falta en el modelo. |
| FONASA | CIRUGIA CARDIOVASCULAR | 2 | Falta en el modelo. |
| FONASA | CIRUGIA DE TORAX | 2 | Falta en el modelo. |
| FONASA | CIRUGIA PLASTICA Y REPARADORA | 2 | Falta en el modelo. |
| FONASA | CIRUGIA VASCULAR PERIFERICA | 2 | Falta en el modelo. |
| FONASA | DIABETOLOGIA | 2 | Falta en el modelo. |
| FONASA | ENFERMEDADES RESPIRATORIAS PEDIATRICAS | 2 | Falta Neumología Pediátrica en el modelo. |
| FONASA | GENETICA CLINICA | 2 | Falta en el modelo. |
| FONASA | RADIOTERAPIA ONCOLOGICA | 2 | Falta en el modelo. |
| FONASA | GINECOLOGIA PEDIATRICA Y DE LA ADOLESCENCIA | 2 | Falta en el modelo. |
| FONASA | MEDICINA NUCLEAR | 2 | Falta en el modelo. |
| CUPS | OPTOMETRIA | 2 | Profesión que el modelo no tiene. |
| CUPS | TERAPIAS ALTERNATIVAS | 2 | — |
| CUPS | OTRAS ESPECIALIDADES DE PSICOLOGIA | 2 | No nombra la especialidad. |
| CUPS | AGENTE EDUCATIVO | 2 | No es una especialidad. |
| CUPS | HIGIENE ORAL | 2 | Profesión (higienista oral) que el modelo no tiene. |

### Lo que no se pudo obtener

| Hueco | Qué lo destraba |
|---|---|
| CUPS: año de la resolución | Bajar el anexo oficial (SISPRO `CUPSRips` o la resolución del año) y fijar `version`. |
| CUPS: 223 códigos en desacuerdo y 574 sólo en la copia B | Igual: con la tabla oficial se resuelven. |
| FONASA: títulos de los grupos 10, 29 y 33; subgrupos de los grupos combinados (09, 11, 17, 19) | El libro oficial en PDF: los subgrupos permitirían repartir, p. ej., el 17 entre Cardiología y Neumología. |
| Nomenclador PAMI (Argentina) | Verificar su licencia en datos.gob.ar. |
| SIGTAP (Brasil) | Decisión de producto: aceptar texto en portugués o una traducción propia marcada como no oficial. |
| BOE / UEMS / ACGME (currículos de residencia) | Red abierta y curación manual con cita literal por procedimiento. |
| Arancel nacional del Colegio Médico de Bolivia, prestaciones SUS | Conseguir el documento (no se encontró publicado). |

## Para el repo del modelo

1. Sumar a `VS_MEDICAL_SPECIALTY` las especialidades de la tabla de huecos
   (al menos Neurocirugía, Cirugía Plástica, Cirugía Cardiovascular y de Tórax,
   Cirugía de Cabeza y Cuello, Mastología, Medicina Nuclear, Radioterapia).
2. Resolver el duplicado `CIRUGIA_BUCOMAXILOFACIAL` / `CIRUGIA_ORAL_MAXILOFACIAL`.
3. `concept_relationships` no tiene dónde guardar la procedencia de una
   relación; hoy viaja en `concept_properties` del servicio
   (`specialty-service:evidence`). Si se quiere consultar por fuente, el modelo
   necesitaría `source_id`/`evidence_json` en la relación.
4. Encontrado al montar la base de prueba: `03_terminology.seeds.json` trae
   `concept_properties` con `data_type = 'active_data_type'`, que el enum
   `terminology.technical_data_type` rechaza.
