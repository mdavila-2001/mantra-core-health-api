# Fuentes — servicios por especialidad

Registro de cada fuente que alimenta `build-specialty-services.mjs`: quién la
publica, qué versión, por dónde llegaron los bytes, su hash y su licencia. Los
bytes **no** viven en git: se bajan a `<BUILD_DIR>/cache/`
(`$SPECIALTY_SERVICES_BUILD_DIR`, por defecto `../glossary-data-build/specialty-services/`)
y el armado aborta si el SHA-256 no es el de esta tabla.

Fecha de obtención y verificación: **2026-10-24**.

> [!aviso] Transporte ≠ fuente
> La red de la sesión que armó este corpus bloqueaba todos los sitios oficiales
> (fonasa.gob.cl, sispro.gov.co, minsalud, boe.es, who.int, datos.gob.ar…) y
> sólo dejaba pasar GitHub y los registros npm/PyPI. Por eso FONASA y CUPS
> llegaron por **copias de terceros**, y cada una se coteja contra algo
> independiente antes de usarse (ver «Verificación»). Quien tenga acceso a los
> sitios oficiales debería reemplazar el transporte por el original y volver a
> correr el armado: los ids no cambian, porque dependen del código, no del
> transporte.

## Fuentes incorporadas

| Clave | Fuente | Organismo | Versión | URI oficial | Transporte (lo que se bajó) | SHA-256 | Licencia |
|---|---|---|---|---|---|---|---|
| `fonasa` | Arancel de Prestaciones de Salud 2026, Modalidad Libre Elección | Fondo Nacional de Salud (FONASA), Ministerio de Salud de Chile | 2026, vigente desde 2026-03-16 | <https://www.fonasa.gob.cl/wp-content/uploads/sites/3/2026/03/1-Libro-Arancel-MLE-2026.pdf> | Paquete npm `@mariohealthbits/fonasa-mle-open@1.0.0`, miembro `package/data/mle-2026.json` (extraído por su autor del XLSX oficial): <https://registry.npmjs.org/@mariohealthbits/fonasa-mle-open/-/fonasa-mle-open-1.0.0.tgz> | `b622019be7a3a1e3eb560c01415d991947ac21561ed074187f2b9ee687e9e05c` (npm integrity `sha512-heMqNXY6…qI7RA==`) | Documento público del Estado de Chile, sin licencia explícita; se reproduce citando la fuente (mismo criterio que `tools/bolivia-datasets/extract_fonasa.py`). El paquete es MIT. |
| `cups` | CUPS — Clasificación Única de Procedimientos en Salud | Ministerio de Salud y Protección Social de Colombia | **No declarada por las copias** (se carga como `sin-version-declarada`) | <https://web.sispro.gov.co/WebPublico/Consultas/ConsultarDetalleReferenciaBasica.aspx?Code=CUPSRips> | Dos copias independientes, fijadas por commit: **A** `FacturacionDacs/SecretariadeSalud@87164f39752df421e6649ecc9fe1ca39d800422f:cups_catalog.js` (10 024 códigos, tabla de referencia tipo SISPRO); **B** `Ander8zerox/Galeno@7de30b0b79a02541cc96fbd341d0f74f56c00542:backend/src/main/resources/db/migration/V7__cups.sql` (7 882 códigos, de la «Tabla 1. Procedimientos en salud» en PDF) | A `52b261ebf33dc63b80764060b4b30b20332360f4bd2b99c3fd561fb33ed5022d` · B `3733a6087e5c8d64306da9f833e6440db8a02f3748e934dcd441963e09007659` | Anexo de un acto administrativo (resolución anual del Ministerio): texto normativo de libre reproducción (Ley 23 de 1982, art. 41). Los dos repositorios no declaran licencia; de ellos no se toma código, sólo el dato normativo. |
| `boArancel` | Aranceles de Honorarios Médicos | Colegio Médico de Santa Cruz — Comité Científico Departamental | julio 2025 | — (PDF escaneado; ver `mantra-core-health/data/fee-schedules/manifest.json`) | Ya en el repo: `src/common/seed/data/bolivia/fee-schedule.dataset.json` (sembrado por la API como `VS_BO_MEDICAL_PROCEDURE`) | archivo de origen `85c68678…0adb040` | Arancel gremial publicado para su aplicación, sin licencia explícita. Acá **no se copia**: sólo se relacionan los conceptos que ya existen. |
| `boDental` | Listado arancel odontológico 2026 | (ver manifiesto del front) | 2026 | — | Mismo dataset del repo | archivo de origen `6aded6ef…b18b2` | Idem. |

## Verificación (antes de creerle a una copia)

- **FONASA.** La copia npm se coteja contra la extracción del **PDF oficial**
  que ya está en el repo (`tools/bolivia-datasets/data/fonasa-mle-2026-{laboratorio,imagenologia}.json`,
  PDF SHA-256 `79b0021b…cf6a`): **596 de 596** prestaciones coinciden en código,
  nombre (con espacios colapsados) y valor nivel 1. Un solo desacuerdo aborta el
  armado. Los otros 27 grupos no tienen contraprueba en el repo: viajan como
  `review-status = copy-verified` (la copia se verificó donde se pudo).
- **Títulos de grupo FONASA.** El XLSX no trae los títulos. Se tomaron de los
  resultados de búsqueda sobre el libro oficial y sobre <https://www.cliini.ai/herramientas/codigos-fonasa>
  (no oficial) y **se corroboraron por conteo**: el número de prestaciones por
  grupo que publica esa página (p. ej. 11 → 107, 12 → 115, 13 → 114, 16 → 39,
  17 → 227, 18 → 155, 19 → 101, 20 → 66, 21 → 221) coincide exactamente con la
  copia. Los grupos sin título corroborado (10, 29, 33) no asignan nada.
- **CUPS.** Cruce de las dos copias, código por código, comparando el texto
  normalizado (la A escribe «- » donde la norma escribe «, »):
  7 085 coinciden (`two-copies-agree`, se muestra el texto de B), 2 716 sólo
  están en A (`single-copy`: B es una tabla tarifaria que no cubre toda la CUPS,
  su ausencia no contradice), 223 se contradicen y 574 sólo están en B — esas
  dos últimas clases **no entran**.

## Fuentes evaluadas y descartadas

| Fuente | Motivo |
|---|---|
| Nomenclador PAMI (Argentina), copia npm `nomenclador-salud-js@1.0.2` del dataset de datos.gob.ar | La licencia del dataset no se pudo verificar (el portal estaba bloqueado y la búsqueda no la muestra). Pendiente: verificar en <https://datos.gob.ar/dataset/pami-nomenclador-practicas-medicas--valor-por-capitas-modulos>. Además el paquete re-escribe los nombres en «Title Case». |
| Nomenclador HPGD (Argentina), `cluster311/nhpgd` | El repo no trae los datos: los baja de una planilla de Google (bloqueada). |
| SIGTAP (Brasil), espejos `hsms87/sigtap`, `RenatoKR/SIGTAP` | Alcanzable y con la mejor relación procedimiento ↔ ocupación (CBO) que existe, pero en **portugués**: el texto visible del producto es castellano y no hay traducción oficial. |
| WHO ICHI | Sin eje por especialidad; beta 3 «no usar para codificar»; sin descarga alcanzable. |
| ICD-10-PCS (CMS) / CIE-10-ES Procedimientos | Sin eje por especialidad (ejes por sistema corporal); relacionarlos sería inferir. CIE-10-ES ya tiene importador en el glosario. |
| CIE-9-MC (España / DGIS México) | Sin eje por especialidad. |
| CPMS (Perú), tarifarios de Ecuador | Derivados de CPT (AMA): licencia que no tenemos. |
| CPT | Propiedad de la AMA. Excluido por pedido. |
| SNOMED CT | Bolivia no es miembro de SNOMED International. |
| ACGME / ACGME-I case logs, UEMS | Inglés, organizados por CPT, sitios bloqueados. |
| Programas formativos del BOE (España), Cartera de Servicios del SNS | Sitio bloqueado y texto en prosa: extraer procedimientos sería curación manual sin cotejo. |
| Arancel del Colegio Médico de Bolivia (nacional), prestaciones del SUS (Ley 1152) | No se encontró una lista pública por especialidad; minsalud.gob.bo bloqueado. |
| FONASA MAI y FONASA MLE 2025 | MAI no alcanzable; MLE 2025 es la versión anterior de la misma fuente (no es independiente). |
