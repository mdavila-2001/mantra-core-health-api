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

Corpus versionado en `tools/terminology-import/specialty-services/data/` (comprimido, con manifiesto y SHA-256): **5 033** servicios, **5 113** relaciones servicio → especialidad, en
**53** de las 63 especialidades (antes del 2026-10-27: 4 843 servicios, 4 923 relaciones, 52 especialidades). Carga medida en un **Postgres 16 desechable** (no en la base del stack): 1 338 conceptos nuevos
(FONASA 962 + CUPS copias 186 + CUPS 2025 oficial 190), 1 338 designaciones, 7 709 propiedades, 5 113 relaciones, 53 value sets con 5 113 miembros, 4 lotes; la segunda corrida inserta **0**
(salida y consultas de integridad en `docs/trabajo/2026-10-27-terminologia-cierre-huecos/evidencia/C8/`). La columna «CUPS 2025» es la CUPS oficial (Resolución 2706 de 2025); «CUPS» son las dos copias de terceros de la pasada 3,
que **repiten el mismo criterio con otro código** (por eso casi todas las filas coinciden): no se suman dos veces los servicios de una misma consulta, cada código es de su sistema.

| Especialidad | Código | Servicios | FONASA | CUPS | CUPS 2025 | Arancel BO | Nombres distintos |
|---|---|---:|---:|---:|---:|---:|---:|
| Medicina General | `MEDICINA_GENERAL` | 35 | 2 | 10 | 10 | 13 | 25 |
| Medicina Familiar | `MEDICINA_FAMILIAR` | 10 | 2 | 4 | 4 | 0 | 6 |
| Medicina Interna | `MEDICINA_INTERNA` | 53 | 2 | 3 | 3 | 45 | 50 |
| Pediatría | `PEDIATRIA` | 217 | 2 | 4 | 4 | 207 | 213 |
| Ginecología y Obstetricia | `GINECOLOGIA_OBSTETRICIA` | 154 | 68 | 4 | 4 | 78 | 147 |
| Cardiología | `CARDIOLOGIA` | 107 | 3 | 3 | 3 | 98 | 104 |
| Neurología | `NEUROLOGIA` | 80 | 2 | 3 | 3 | 72 | 77 |
| Dermatología | `DERMATOLOGIA` | 157 | 41 | 3 | 3 | 110 | 154 |
| Endocrinología | `ENDOCRINOLOGIA` | 29 | 2 | 3 | 3 | 21 | 26 |
| Gastroenterología | `GASTROENTEROLOGIA` | 222 | 159 | 3 | 3 | 57 | 219 |
| Neumología | `NEUMOLOGIA` | 8 | 2 | 3 | 3 | 0 | 5 |
| Nefrología | `NEFROLOGIA` | 154 | 4 | 3 | 3 | 144 | 150 |
| Urología | `UROLOGIA` | 185 | 2 | 3 | 3 | 177 | 181 |
| Traumatología y Ortopedia | `TRAUMATOLOGIA` | 1139 | 223 | 4 | 4 | 908 | 1133 |
| Cirugía General | `CIRUGIA_GENERAL` | 329 | 2 | 4 | 4 | 319 | 323 |
| Oftalmología | `OFTALMOLOGIA` | 280 | 117 | 3 | 3 | 157 | 276 |
| Otorrinolaringología | `OTORRINOLARINGOLOGIA` | 362 | 116 | 3 | 3 | 240 | 353 |
| Psiquiatría | `PSIQUIATRIA` | 37 | 2 | 9 | 9 | 17 | 28 |
| Psicología Clínica | `PSICOLOGIA_CLINICA` | 28 | 2 | 13 | 13 | 0 | 15 |
| Oncología | `ONCOLOGIA` | 181 | 2 | 3 | 3 | 173 | 173 |
| Hematología | `HEMATOLOGIA` | 12 | 2 | 3 | 3 | 4 | 9 |
| Reumatología | `REUMATOLOGIA` | 30 | 2 | 3 | 3 | 22 | 27 |
| Infectología | `INFECTOLOGIA` | 8 | 2 | 3 | 3 | 0 | 5 |
| Geriatría | `GERIATRIA` | 8 | 2 | 3 | 3 | 0 | 5 |
| Anestesiología | `ANESTESIOLOGIA` | 24 | 4 | 3 | 3 | 14 | 21 |
| Radiología e Imagenología | `RADIOLOGIA` | 290 | 153 | 3 | 3 | 131 | 281 |
| Patología Clínica | `PATOLOGIA_CLINICA` | 0 | 0 | 0 | 0 | 0 | 0 |
| Medicina de Emergencia | `MEDICINA_EMERGENCIA` | 51 | 1 | 1 | 1 | 48 | 50 |
| Medicina Intensiva | `MEDICINA_INTENSIVA` | 42 | 0 | 0 | 0 | 42 | 42 |
| Nutrición y Dietética | `NUTRICION` | 16 | 2 | 7 | 7 | 0 | 9 |
| Odontología | `ODONTOLOGIA` | 132 | 1 | 9 | 9 | 113 | 120 |
| Fisioterapia y Rehabilitación | `FISIOTERAPIA` | 20 | 7 | 6 | 7 | 0 | 14 |
| Enfermería | `ENFERMERIA` | 21 | 5 | 8 | 8 | 0 | 13 |
| Bioquímica Clínica | `BIOQUIMICA_CLINICA` | 0 | 0 | 0 | 0 | 0 | 0 |
| Obstetricia | `OBSTETRICIA` | 5 | 5 | 0 | 0 | 0 | 5 |
| Medicina Deportiva | `MEDICINA_DEPORTIVA` | 6 | 0 | 3 | 3 | 0 | 3 |
| Anatomía Patológica | `ANATOMIA_PATOLOGICA` | 27 | 13 | 0 | 0 | 14 | 27 |
| Cirugía Bucomaxilofacial | `CIRUGIA_BUCOMAXILOFACIAL` | 0 | 0 | 0 | 0 | 0 | 0 |
| Cirugía Pediátrica | `CIRUGIA_PEDIATRICA` | 228 | 2 | 3 | 3 | 220 | 225 |
| Medicina del Trabajo | `MEDICINA_DEL_TRABAJO` | 3 | 0 | 0 | 3 | 0 | 3 |
| Medicina Física y Rehabilitación | `MEDICINA_FISICA_REHABILITACION` | 53 | 2 | 3 | 3 | 45 | 49 |
| Salud Familiar Comunitaria Intercultural | `SALUD_FAMILIAR_COMUNITARIA_INTERCULTURAL` | 0 | 0 | 0 | 0 | 0 | 0 |
| Cirugía Oncológica | `CIRUGIA_ONCOLOGICA` | 6 | 0 | 3 | 3 | 0 | 3 |
| Coloproctología | `COLOPROCTOLOGIA` | 53 | 2 | 3 | 3 | 45 | 50 |
| Cardiología Pediátrica | `CARDIOLOGIA_PEDIATRICA` | 6 | 0 | 3 | 3 | 0 | 3 |
| Infectología Pediátrica | `INFECTOLOGIA_PEDIATRICA` | 6 | 0 | 3 | 3 | 0 | 3 |
| Medicina del Dolor | `MEDICINA_DEL_DOLOR` | 0 | 0 | 0 | 0 | 0 | 0 |
| Medicina Materno Fetal | `MEDICINA_MATERNO_FETAL` | 2 | 2 | 0 | 0 | 0 | 2 |
| Neonatología | `NEONATOLOGIA` | 7 | 1 | 3 | 3 | 0 | 4 |
| Neurología Pediátrica | `NEUROLOGIA_PEDIATRICA` | 67 | 2 | 3 | 3 | 59 | 64 |
| Oncología Ginecológica | `ONCOLOGIA_GINECOLOGICA` | 0 | 0 | 0 | 0 | 0 | 0 |
| Oncología Pediátrica | `ONCOLOGIA_PEDIATRICA` | 6 | 0 | 3 | 3 | 0 | 3 |
| Ortopedia Pediátrica | `ORTOPEDIA_PEDIATRICA` | 8 | 0 | 4 | 4 | 0 | 4 |
| Terapia Intensiva Pediátrica | `TERAPIA_INTENSIVA_PEDIATRICA` | 102 | 0 | 0 | 0 | 102 | 102 |
| Endodoncia | `ENDODONCIA` | 20 | 0 | 3 | 3 | 14 | 17 |
| Ortodoncia | `ORTODONCIA` | 6 | 0 | 3 | 3 | 0 | 3 |
| Periodoncia | `PERIODONCIA` | 24 | 0 | 3 | 3 | 18 | 21 |
| Estética Dental | `ESTETICA_DENTAL` | 0 | 0 | 0 | 0 | 0 | 0 |
| Rehabilitación Oral | `REHABILITACION_ORAL` | 37 | 0 | 3 | 3 | 31 | 34 |
| Cirugía Oral y Maxilofacial | `CIRUGIA_ORAL_MAXILOFACIAL` | 0 | 0 | 0 | 0 | 0 | 0 |
| Odontopediatría | `ODONTOPEDIATRIA` | 20 | 0 | 3 | 3 | 14 | 17 |
| Implantología Oral | `IMPLANTOLOGIA_ORAL` | 0 | 0 | 0 | 0 | 0 | 0 |
| Armonización Orofacial | `ARMONIZACION_OROFACIAL` | 0 | 0 | 0 | 0 | 0 | 0 |

### Especialidades sin servicios, y por qué

| Especialidad | Motivo |
|---|---|
| Patología Clínica, Bioquímica Clínica | Sus servicios son análisis de laboratorio: los cubre la sesión de análisis (FONASA grupo 03 excluido a propósito). |
| ~~Medicina del Trabajo~~ | **Cerrada el 2026-10-27**: la CUPS oficial (Res. 2706/2025) trae 89.0.2.62, 89.0.3.62 y 89.0.4.62 «… POR ESPECIALISTA EN MEDICINA DEL TRABAJO O SEGURIDAD Y SALUD EN EL TRABAJO»; entran 3 servicios. |
| Medicina del Dolor | Ninguna fuente alcanzable la nombra sola; CUPS dice «Dolor y cuidados paliativos» (más amplia) y no se asimila. |
| Salud Familiar Comunitaria Intercultural | Es boliviana; CUPS dice «Salud familiar y comunitaria» (sin el componente intercultural) y no se asimila. |
| Cirugía Bucomaxilofacial, Cirugía Oral y Maxilofacial | El modelo tiene **dos** códigos para lo mismo; las fuentes dicen «Cirugía maxilofacial» / «Cirugía oral»; elegir uno sería inventar. |
| Oncología Ginecológica, Estética Dental, Implantología Oral, Armonización Orofacial | Ninguna fuente alcanzable las nombra. |

## Cierre de huecos — 2026-10-27

Sondeo del 2026-10-27 (`evidencia/C8/sondeo-especialidades-2026-10-27.txt`). Lo que figuraba como «bloqueado por red» el 2026-10-24:

| Fuente | Estado el 2026-10-24 | Estado hoy | Qué se hizo | Antes → después |
|---|---|---|---|---|
| **CUPS (Colombia)**, año de la resolución y códigos en desacuerdo | `connect_rejected`; sólo dos copias de terceros | `minsalud.gov.co` **200**; el PDF oficial de la **Resolución 2706 de 2025** (23-dic-2025, rige desde el 1-ene-2026; 395 págs., SHA-256 `a9c198bb…bece`) se baja sin problema y el normograma da los mismos bytes; `web.sispro.gov.co` y `sispro.gov.co` **sin respuesta** | parser del Anexo Técnico 2 «Lista tabular» sobre el PDF oficial (`pdftotext -raw`): 99 categorías, 723 subcategorías, 2 678 grupos y **9 458 procedimientos** (una subcategoría, `32.9.`, no existe en la fuente: `32.9.0.` cuelga de `32.`); nuevo code system `cups-co-2706-2025` con los **190** servicios que el descriptor atribuye a un prestador | 0 → 190 servicios oficiales; año fijado (2025) y versión `2706-2025` |
| CUPS: «Medicina del Trabajo» sin servicios | las copias se contradecían | resuelta con la fuente oficial | 3 servicios (89.0.2.62/89.0.3.62/89.0.4.62) | 0 → 3 |
| CUPS: 223 códigos en desacuerdo y 574 sólo en la copia B | sin resolver | el esquema de códigos cambió: la CUPS 2025 usa `NN.N.N.NN` (la de las copias, 6 dígitos) | los 223/574 de las copias **no se resuelven**: son del esquema anterior; las copias siguen sólo como transporte de terceros de ese esquema | sin cambio |
| **FONASA MLE 2026** | 403 | `fonasa.gob.cl` y `fonasa.cl` **403**; `fonasa.gob.cl` sin `www` sin respuesta | sin cambio: sigue la copia npm verificada 596/596 contra el PDF oficial del repo | sin cambio |
| **TUSS (Brasil)** y **PAMI (Argentina)** | bloqueados / licencia sin verificar | `www.gov.br/ans` 200; `datos.gob.ar` 502 | los cubre el carril de laboratorio (`lab-tests`, commit «cotea TUSS y PAMI con sus originales y fija la licencia de PAMI»); acá no se tocan. TUSS es texto en portugués (la decisión de producto de usarlo o traducirlo sigue abierta) | sin cambio en este carril |
| **SIGTAP (Brasil)** | bloqueado | `sigtap.datasus.gov.br` sin respuesta; `www.gov.br/saude` 200 | portugués, sin traducción oficial: sin cambio | sin cambio |
| **Arancel Santa Cruz** | en el repo | — | sin cambio (ya relacionado: 3 695 servicios) | sin cambio |
| Arancel nacional del Colegio Médico de Bolivia, prestaciones del SUS | no se encontró | `minsalud.gob.bo` **200** (la consigna decía «no responde»); el sitio no publica el arancel; `cmsc.org.bo` sin respuesta | sin cambio: no hay documento | sin cambio |
| Programas de residencia (BOE, UEMS, ACGME) | bloqueados | `boe.es`, `uems.eu`, `acgme.org` **200** | sin cargar: inglés/prosa con curación manual (misma razón que el 2026-10-24) | sin cambio |
| Listado oficial boliviano de especialidades | — | la *Convocatoria Nacional al Proceso de Admisión a la Residencia Médica 2026* (`minsalud.gob.bo`, 4 págs.) trae la tabla de plazas por especialidad en un diseño de varias columnas con palabras cortadas al final del renglón («ANESTESI-OLOGÍA») | **no se carga**: el parser sería curación manual sin cotejo; queda como fuente candidata para la propuesta al modelo | hueco de curaduría |

Otras fuentes abiertas revisadas hoy: el dataset **«Procedimiento del PBS»** de datos.gov.co (`9zcz-bjue`, MinSalud, 8 114 filas con código CUPS y descripción) es **CC BY-SA 4.0**: no se carga (decisión del propietario sobre *share-alike*; ver el reporte del carril) y no aporta eje por especialidad.

**No cubierto**: la carga en la base real del stack (sólo Postgres desechable); la verificación de la extracción del PDF contra otra copia oficial independiente (el normograma da los mismos bytes: no es independiente); los servicios de CUPS 2025 que no nombran un prestador (no se infiere especialidad).

## Huecos

### Especialidades y profesiones que las fuentes nombran y el modelo no tiene

Propuesta para `mantra-core-health-model` (agregar a `VS_MEDICAL_SPECIALTY`; al cargarlas, re-correr el importador relaciona estos servicios sin tocar código). Regenerada el 2026-10-27 con
`propose-model-specialties.mjs` (`data/model-proposal.json`). **Cada fila es un nombre tal cual lo escribe una sola fuente**: no se fusionan nombres de fuentes distintas («CIRUGIA PLASTICA Y REPARADORA» de FONASA y
«Cirugía Plástica, Estética y Reconstructiva» del arancel SCZ no se declaran la misma cosa) y no se propone ningún código: lo fija el propietario del modelo. Totales de servicios que quedan sin especialidad: arancel SCZ **713** (6 nombres),
FONASA **209** (20), CUPS copias **184** (55) y CUPS 2025 **185** (55).

| Fuente | Nombre en la fuente | Servicios sin especialidad del modelo | Motivo |
|---|---|---:|---|
| Arancel SCZ | Neurocirugía | 266 | Falta Neurocirugía en el modelo. |
| Arancel SCZ | Cirugía Plástica, Estética y Reconstructiva | 205 | Falta Cirugía Plástica en el modelo. |
| Arancel SCZ | Cirugía Cardíaca, Torácica y Vascular | 192 | Falta Cirugía Cardiovascular y de Tórax en el modelo. |
| FONASA MLE 2026 | Grupo 15 · Cirugía plástica y reparadora | 66 | Falta en el modelo. |
| FONASA MLE 2026 | Grupo 14 · Cirugía de cabeza y cuello | 60 | Falta en el modelo. |
| FONASA MLE 2026 | Grupo 05 · Medicina nuclear y radioterapia | 43 | Falta Medicina Nuclear / Radioterapia en el modelo. |
| Arancel SCZ | Mastología | 36 | Falta Mastología en el modelo. |
| CUPS (copias) | EQUIPO INTERDISCIPLINARIO | 13 | No es una especialidad. |
| CUPS 2025 (Res. 2706/2025) | EQUIPO INTERDISCIPLINARIO | 13 | No es una especialidad. |
| Arancel SCZ | Salud Pública | 10 | Falta Salud Pública en el modelo; además arancela consultorías, no atención. |
| CUPS (copias) | TERAPIA OCUPACIONAL | 8 | Profesión que el modelo no tiene. |
| CUPS 2025 (Res. 2706/2025) | TERAPIA OCUPACIONAL | 8 | Profesión que el modelo no tiene. |
| CUPS (copias) | TRABAJO SOCIAL | 8 | Profesión que el modelo no tiene. |
| CUPS 2025 (Res. 2706/2025) | TRABAJO SOCIAL | 8 | Profesión que el modelo no tiene. |
| FONASA MLE 2026 | TERAPIA OCUPACIONAL | 6 | Profesión que el modelo no tiene. |
| CUPS 2025 (Res. 2706/2025) | MEDICINA ESPECIALIZADA | 5 | No nombra la especialidad. |
| CUPS (copias) | TERAPIA RESPIRATORIA | 5 | Profesión que el modelo no tiene. |
| CUPS 2025 (Res. 2706/2025) | TERAPIA RESPIRATORIA | 5 | Profesión que el modelo no tiene. |
| Arancel SCZ | Auditoría Médica | 4 | VS_MEDICAL_SPECIALTY no tiene Auditoría Médica. |
| FONASA MLE 2026 | FONOAUDIOLOGO | 4 | Profesión que el modelo no tiene. |
| CUPS (copias) | MEDICINA ESPECIALIZADA | 4 | No nombra la especialidad. |
| CUPS (copias) | OTRAS ESPECIALIDADES MEDICAS | 4 | No nombra la especialidad. |
| CUPS 2025 (Res. 2706/2025) | OTRAS ESPECIALIDADES MEDICAS | 4 | No nombra la especialidad. |
| CUPS (copias) | ALERGOLOGIA | 3 | Falta en el modelo. |
| CUPS 2025 (Res. 2706/2025) | ALERGOLOGIA | 3 | Falta en el modelo. |
| CUPS (copias) | ANESTESIOLOGIA CARDIOVASCULAR | 3 | Subespecialidad sin código en el modelo. |
| CUPS 2025 (Res. 2706/2025) | ANESTESIOLOGIA CARDIOVASCULAR | 3 | Subespecialidad sin código en el modelo. |
| CUPS (copias) | CIRUGIA CARDIOVASCULAR | 3 | Falta en el modelo. |
| CUPS 2025 (Res. 2706/2025) | CIRUGIA CARDIOVASCULAR | 3 | Falta en el modelo. |
| CUPS (copias) | CIRUGIA DE CABEZA Y CUELLO | 3 | Falta en el modelo. |
| CUPS 2025 (Res. 2706/2025) | CIRUGIA DE CABEZA Y CUELLO | 3 | Falta en el modelo. |
| CUPS (copias) | CIRUGIA DE MAMA Y TUMORES DE TEJIDOS BLANDOS | 3 | Falta en el modelo. |
| CUPS 2025 (Res. 2706/2025) | CIRUGIA DE MAMA Y TUMORES DE TEJIDOS BLANDOS | 3 | Falta en el modelo. |
| CUPS (copias) | CIRUGIA DE TORAX | 3 | Falta en el modelo. |
| CUPS 2025 (Res. 2706/2025) | CIRUGIA DE TORAX | 3 | Falta en el modelo. |
| CUPS (copias) | CIRUGIA GASTROINTESTINAL | 3 | Falta en el modelo. |
| CUPS 2025 (Res. 2706/2025) | CIRUGIA GASTROINTESTINAL | 3 | Falta en el modelo. |
| CUPS (copias) | CIRUGIA MAXILOFACIAL | 3 | El modelo tiene CIRUGIA_BUCOMAXILOFACIAL y CIRUGIA_ORAL_MAXILOFACIAL; ninguna lleva este nombre exacto y elegir una sería inventar. |
| CUPS 2025 (Res. 2706/2025) | CIRUGIA MAXILOFACIAL | 3 | El modelo tiene CIRUGIA_BUCOMAXILOFACIAL y CIRUGIA_ORAL_MAXILOFACIAL; ninguna lleva este nombre exacto y elegir una sería inventar. |
| CUPS (copias) | CIRUGIA ORAL | 3 | Idem: no coincide con ninguna de las dos del modelo. |
| CUPS 2025 (Res. 2706/2025) | CIRUGIA ORAL | 3 | Idem: no coincide con ninguna de las dos del modelo. |
| CUPS (copias) | CIRUGIA PLASTICA, ESTETICA Y RECONSTRUCTIVA | 3 | Falta en el modelo. |
| CUPS 2025 (Res. 2706/2025) | CIRUGIA PLASTICA, ESTETICA Y RECONSTRUCTIVA | 3 | Falta en el modelo. |
| CUPS (copias) | CIRUGIA VASCULAR | 3 | Falta en el modelo. |
| CUPS 2025 (Res. 2706/2025) | CIRUGIA VASCULAR | 3 | Falta en el modelo. |
| CUPS (copias) | DOLOR Y CUIDADOS PALIATIVOS | 3 | Más amplia que MEDICINA_DEL_DOLOR (incluye paliativos): no se asimila. |
| CUPS 2025 (Res. 2706/2025) | DOLOR Y CUIDADOS PALIATIVOS | 3 | Más amplia que MEDICINA_DEL_DOLOR (incluye paliativos): no se asimila. |
| CUPS (copias) | ENDOCRINOLOGIA PEDIATRICA | 3 | Falta en el modelo. |
| CUPS 2025 (Res. 2706/2025) | ENDOCRINOLOGIA PEDIATRICA | 3 | Falta en el modelo. |
| CUPS (copias) | ESTOMATOLOGIA Y CIRUGIA ORAL | 3 | Idem. |
| CUPS 2025 (Res. 2706/2025) | ESTOMATOLOGIA Y CIRUGIA ORAL | 3 | Idem. |
| CUPS (copias) | FONIATRIA Y FONOAUDIOLOGIA | 3 | Profesión que el modelo no tiene. |
| CUPS 2025 (Res. 2706/2025) | FONIATRIA Y FONOAUDIOLOGIA | 3 | Profesión que el modelo no tiene. |
| CUPS (copias) | FONOAUDIOLOGIA | 3 | Profesión que el modelo no tiene. |
| CUPS 2025 (Res. 2706/2025) | FONOAUDIOLOGIA | 3 | Profesión que el modelo no tiene. |
| CUPS (copias) | GASTROENTEROLOGIA PEDIATRICA | 3 | Falta en el modelo. |
| CUPS 2025 (Res. 2706/2025) | GASTROENTEROLOGIA PEDIATRICA | 3 | Falta en el modelo. |
| CUPS (copias) | GENETICA MEDICA | 3 | Falta en el modelo. |
| CUPS 2025 (Res. 2706/2025) | GENETICA MEDICA | 3 | Falta en el modelo. |
| CUPS (copias) | HEMATOLOGIA PEDIATRICA | 3 | Falta en el modelo. |
| CUPS 2025 (Res. 2706/2025) | HEMATOLOGIA PEDIATRICA | 3 | Falta en el modelo. |
| CUPS (copias) | HEPATOLOGIA | 3 | Falta en el modelo. |
| CUPS 2025 (Res. 2706/2025) | HEPATOLOGIA | 3 | Falta en el modelo. |
| CUPS (copias) | MASTOLOGIA | 3 | Falta en el modelo. |
| CUPS 2025 (Res. 2706/2025) | MASTOLOGIA | 3 | Falta en el modelo. |
| CUPS (copias) | MEDICINA AEROESPACIAL | 3 | Falta en el modelo. |
| CUPS 2025 (Res. 2706/2025) | MEDICINA AEROESPACIAL | 3 | Falta en el modelo. |
| CUPS (copias) | MEDICINA ALTERNATIVA (AYURVEDA) | 3 | — |
| CUPS 2025 (Res. 2706/2025) | MEDICINA ALTERNATIVA (AYURVEDA) | 3 | — |
| CUPS (copias) | MEDICINA ALTERNATIVA (HOMEOPATICA) | 3 | — |
| CUPS 2025 (Res. 2706/2025) | MEDICINA ALTERNATIVA (HOMEOPATICA) | 3 | — |
| CUPS (copias) | MEDICINA ALTERNATIVA (MEDICINA TRADICIONAL CHINA) | 3 | — |
| CUPS 2025 (Res. 2706/2025) | MEDICINA ALTERNATIVA (MEDICINA TRADICIONAL CHINA) | 3 | — |
| CUPS (copias) | MEDICINA ALTERNATIVA (NATUROPATIA) | 3 | — |
| CUPS 2025 (Res. 2706/2025) | MEDICINA ALTERNATIVA (NATUROPATIA) | 3 | — |
| CUPS (copias) | MEDICINA ALTERNATIVA (NEURALTERAPEUTICA) | 3 | — |
| CUPS 2025 (Res. 2706/2025) | MEDICINA ALTERNATIVA (NEURALTERAPEUTICA) | 3 | — |
| CUPS (copias) | MEDICINA ALTERNATIVA (OSTEOPATICA) | 3 | — |
| CUPS 2025 (Res. 2706/2025) | MEDICINA ALTERNATIVA (OSTEOPATICA) | 3 | — |
| CUPS (copias) | MEDICINA ESTETICA | 3 | Falta en el modelo. |
| CUPS 2025 (Res. 2706/2025) | MEDICINA ESTETICA | 3 | Falta en el modelo. |
| CUPS (copias) | MEDICINA FORENSE | 3 | Falta en el modelo. |
| CUPS 2025 (Res. 2706/2025) | MEDICINA FORENSE | 3 | Falta en el modelo. |
| CUPS (copias) | MEDICINA NUCLEAR | 3 | Falta en el modelo. |
| CUPS 2025 (Res. 2706/2025) | MEDICINA NUCLEAR | 3 | Falta en el modelo. |
| CUPS (copias) | NEFROLOGIA PEDIATRICA | 3 | Falta en el modelo. |
| CUPS 2025 (Res. 2706/2025) | NEFROLOGIA PEDIATRICA | 3 | Falta en el modelo. |
| CUPS (copias) | NEUMOLOGIA PEDIATRICA | 3 | Falta en el modelo. |
| CUPS 2025 (Res. 2706/2025) | NEUMOLOGIA PEDIATRICA | 3 | Falta en el modelo. |
| CUPS (copias) | NEUROCIRUGIA | 3 | Falta en el modelo. |
| CUPS 2025 (Res. 2706/2025) | NEUROCIRUGIA | 3 | Falta en el modelo. |
| CUPS (copias) | ONCOHEMATOLOGIA PEDIATRICA | 3 | Falta en el modelo. |
| CUPS 2025 (Res. 2706/2025) | ONCOHEMATOLOGIA PEDIATRICA | 3 | Falta en el modelo. |
| CUPS (copias) | OTRAS ESPECIALIDADES EN ODONTOLOGIA | 3 | No nombra la especialidad. |
| CUPS 2025 (Res. 2706/2025) | OTRAS ESPECIALIDADES EN ODONTOLOGIA | 3 | No nombra la especialidad. |
| CUPS (copias) | PSIQUIATRIA PEDIATRICA | 3 | Falta en el modelo. |
| CUPS 2025 (Res. 2706/2025) | PSIQUIATRIA PEDIATRICA | 3 | Falta en el modelo. |
| CUPS (copias) | RADIOLOGIA ORAL Y MAXILOFACIAL | 3 | Falta en el modelo. |
| CUPS 2025 (Res. 2706/2025) | RADIOLOGIA ORAL Y MAXILOFACIAL | 3 | Falta en el modelo. |
| CUPS (copias) | RADIOTERAPIA | 3 | Falta en el modelo. |
| CUPS 2025 (Res. 2706/2025) | RADIOTERAPIA | 3 | Falta en el modelo. |
| CUPS (copias) | REUMATOLOGIA PEDIATRICA | 3 | Falta en el modelo. |
| CUPS 2025 (Res. 2706/2025) | REUMATOLOGIA PEDIATRICA | 3 | Falta en el modelo. |
| CUPS (copias) | SALUD FAMILIAR Y COMUNITARIA | 3 | No es SALUD_FAMILIAR_COMUNITARIA_INTERCULTURAL (la SAFCI boliviana incluye el componente intercultural): no se asimila. |
| CUPS 2025 (Res. 2706/2025) | SALUD FAMILIAR Y COMUNITARIA | 3 | No es SALUD_FAMILIAR_COMUNITARIA_INTERCULTURAL (la SAFCI boliviana incluye el componente intercultural): no se asimila. |
| CUPS (copias) | SEXOLOGIA CLINICA | 3 | Falta en el modelo. |
| CUPS 2025 (Res. 2706/2025) | SEXOLOGIA CLINICA | 3 | Falta en el modelo. |
| CUPS (copias) | TOXICOLOGIA CLINICA | 3 | Falta en el modelo. |
| CUPS 2025 (Res. 2706/2025) | TOXICOLOGIA CLINICA | 3 | Falta en el modelo. |
| CUPS (copias) | TRASPLANTES | 3 | Falta en el modelo. |
| CUPS 2025 (Res. 2706/2025) | TRASPLANTES | 3 | Falta en el modelo. |
| CUPS (copias) | AGENTE EDUCATIVO | 2 | No es una especialidad. |
| CUPS 2025 (Res. 2706/2025) | AGENTE EDUCATIVO | 2 | No es una especialidad. |
| FONASA MLE 2026 | CIRUGIA CARDIOVASCULAR | 2 | Falta en el modelo. |
| FONASA MLE 2026 | CIRUGIA DE CABEZA, CUELLO Y MAXILOFACIAL | 2 | Falta en el modelo. |
| FONASA MLE 2026 | CIRUGIA DE TORAX | 2 | Falta en el modelo. |
| FONASA MLE 2026 | CIRUGIA PLASTICA Y REPARADORA | 2 | Falta en el modelo. |
| FONASA MLE 2026 | CIRUGIA VASCULAR PERIFERICA | 2 | Falta en el modelo. |
| FONASA MLE 2026 | DIABETOLOGIA | 2 | Falta en el modelo. |
| FONASA MLE 2026 | ENDOCRINOLOGIA PEDIATRICA | 2 | Falta en el modelo. |
| FONASA MLE 2026 | ENFERMEDADES RESPIRATORIAS PEDIATRICAS | 2 | Falta Neumología Pediátrica en el modelo. |
| FONASA MLE 2026 | GENETICA CLINICA | 2 | Falta en el modelo. |
| FONASA MLE 2026 | GINECOLOGIA PEDIATRICA Y DE LA ADOLESCENCIA | 2 | Falta en el modelo. |
| CUPS (copias) | HIGIENE ORAL | 2 | Profesión (higienista oral) que el modelo no tiene. |
| CUPS 2025 (Res. 2706/2025) | HIGIENE ORAL | 2 | Profesión (higienista oral) que el modelo no tiene. |
| FONASA MLE 2026 | INMUNOLOGIA | 2 | Falta en el modelo. |
| FONASA MLE 2026 | MEDICINA NUCLEAR | 2 | Falta en el modelo. |
| FONASA MLE 2026 | NEUROCIRUGIA | 2 | Falta en el modelo. |
| CUPS (copias) | OPTOMETRIA | 2 | Profesión que el modelo no tiene. |
| CUPS 2025 (Res. 2706/2025) | OPTOMETRIA | 2 | Profesión que el modelo no tiene. |
| CUPS (copias) | OTRAS ESPECIALIDADES DE PSICOLOGIA | 2 | No nombra la especialidad. |
| CUPS 2025 (Res. 2706/2025) | OTRAS ESPECIALIDADES DE PSICOLOGIA | 2 | No nombra la especialidad. |
| FONASA MLE 2026 | PSIQUIATRIA PEDIATRICA Y DE LA ADOLESCENCIA | 2 | Falta en el modelo. |
| FONASA MLE 2026 | RADIOTERAPIA ONCOLOGICA | 2 | Falta en el modelo. |
| CUPS (copias) | TERAPIAS ALTERNATIVAS | 2 | — |
| CUPS 2025 (Res. 2706/2025) | TERAPIAS ALTERNATIVAS | 2 | — |

### Lo que no se pudo obtener

| Hueco | Qué lo resolvería |
|---|---|
| ~~CUPS: año de la resolución~~ | **Cerrado el 2026-10-27** para la CUPS oficial (`cups-co-2706-2025`, versión `2706-2025`). Las dos copias de terceros siguen sin año declarado (son del esquema de códigos anterior). |
| CUPS copias: 223 códigos en desacuerdo y 574 sólo en la copia B | No se resuelven: son del esquema anterior (6 dígitos) y la tabla oficial vigente usa otro esquema (`NN.N.N.NN`); un cruce entre esquemas no está publicado. |
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
5. (2026-10-27) `VS_MEDICAL_SPECIALTY` no distingue la **profesión** de la **especialidad médica**: las fuentes nombran Terapia Ocupacional,
   Fonoaudiología, Terapia Respiratoria, Trabajo Social, Optometría e Higiene Oral como prestadores de consulta (CUPS 2025: 89.0.2.09 a
   89.0.2.13 y equivalentes). Si el modelo quiere relacionarlas, necesita decidir si entran al mismo value set o a uno de profesiones.
6. (2026-10-27) La relación servicio → especialidad se guarda con la evidencia en una propiedad del servicio; sigue sin haber dónde
   guardar la procedencia de la relación (punto 3).

## Corrección posterior a la revisión independiente (2026-10-28)

- `data/` versionada estaba armada con el código anterior: cada registro llevaba `source.retrievedAt` (el SHA-256 del corpus variaba con la fecha de descarga) y el `MANIFEST.json` no tenía `retrievedAt`, de modo que `load-specialty-services.mjs` desde `data/` guardaba la procedencia **sin** fecha de descarga. Se regeneró con `build-specialty-services.mjs --write-repo-data`: el corpus (5 033 registros, 5 113 relaciones) tiene SHA-256 `34feeadc…9163` y es **idéntico** entre dos armados con descargas frescas (distinto `retrievedAt`); lo que sí cambia con la fecha es la parte `meta` y el manifiesto, por diseño. Lo cubre un test sobre `data/`.
- Carga repetida desde `data/` en un Postgres 16 desechable (1.ª: 1 338 conceptos, 5 113 relaciones, 53 value sets; 2.ª: 0 en todo; integridad: 0 duplicados, 0 huérfanas, 0 destinos fuera de `VS_MEDICAL_SPECIALTY`): `docs/trabajo/2026-10-27-terminologia-cierre-huecos/evidencia/C2-correcciones/`.
- `test/disposable-db/fresh-db.sh` (hace `drop database`) sólo corre con servidor local y base `*_test`; probado en `test/specialty-services.test.mjs`.
