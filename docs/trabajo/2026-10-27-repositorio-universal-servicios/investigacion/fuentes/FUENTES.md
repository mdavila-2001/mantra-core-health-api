# Fuentes para el repositorio universal de servicios de salud (castellano)

- Fecha de investigación y descarga: **2026-10-27**.
- Datos crudos (no van a git): `/home/user/servicios-build/sources/<clave>/`. Por cada archivo hay un `<archivo>.sha256` y un `<archivo>.url` con la URL exacta de la que salió.
- Versión legible por máquina de esta tabla: [`fuentes.json`](./fuentes.json).
- Punto de partida: `tools/terminology-import/specialty-services/SOURCES.md` y `docs/seed-research/specialty-services.md`. La sesión anterior sólo llegaba a GitHub, npm y PyPI. Esta llega a la mayoría de los sitios oficiales. En la tabla de abajo, «alcanzable» quiere decir «se bajó desde acá el 2026-10-27».

## 1. Base legal para reutilizar normas publicadas (sirve para todas las órdenes españolas)

- **Ley de Propiedad Intelectual (España), art. 13**: «No son objeto de propiedad intelectual las disposiciones legales o reglamentarias y sus correspondientes proyectos, […] y los actos, acuerdos, deliberaciones y dictámenes de los organismos públicos, así como las traducciones oficiales». Texto consolidado en <https://www.boe.es/buscar/act.php?id=BOE-A-1996-8930#a13>, verificado hoy. Esto cubre las órdenes de precios públicos publicadas en BOE, BOCM, BOJA, DOGC, DOG, BORM y BOC, y el acuerdo del Consejo de Administración de Osakidetza (BOPV).
- **Condiciones de reutilización del BOE**: licencia tipo aprobada por Resolución de la Agencia de 27-06-2024, en el marco de la Ley 37/2007 (<https://www.boe.es/informacion/aviso_legal/index.php>). Verificado hoy.
- **Ministerio de Sanidad**: «La información disponible en este sitio web, salvo indicación expresa en contrario, es susceptible de reutilización; quedando autorizada su reproducción total o parcial, modificación, distribución y comunicación, para usos comerciales y no comerciales». Las condiciones son no desnaturalizar el contenido, citar la fuente y citar la fecha de la última actualización (<https://www.sanidad.gob.es/avisoLegal/home.htm>). Verificado hoy.

## 2. Tabla de fuentes

Leyenda de «Lic. verif.»: **sí** = leí el texto de la licencia hoy en la URL citada · **por ley** = norma publicada en boletín oficial, cubierta por LPI art. 13 · **no** = no se pudo verificar.

Conteos: «ítems» es lo que conté hoy sobre el archivo bajado. En las órdenes de precios incluye los GRD de hospitalización, y entre paréntesis va cuántos son GRD, porque **los GRD no son servicios importables** por una práctica.

### 2.1 Descargadas (alcanzables, licencia aceptable)

| Clave | Fuente | Organismo · país | Versión | Idioma | Ítems | Eje especialidad | Lic. verif. | Calidad / uso |
|---|---|---|---|---|---|---|---|---|
| `cie10es-pcs-2026` | CIE-10-ES Procedimientos, tabla de referencia (+ tabla de conversión) | Ministerio de Sanidad · ES | 6.ª ed. 2026, v1.0 del 2026-06-02 | es | **78 948** códigos de 7 caracteres (68 367 médico-quirúrgicos, sección 0) | No: ejes por sistema corporal, operación y abordaje | sí (aviso legal de Sanidad). La hoja «Introducción» dice «Traducción Española de ICD-10-PCS … © CMS» | Máxima cobertura en castellano oficial. Las descripciones son técnicas («Escisión en coroides, derecha, abordaje abierto»): sirven de **referencia y destino de mapeo**, no como nombre de tienda. El repo ya tiene importador (`import-cie10es.mjs`). |
| `co-cups-2026-res2706` | CUPS, Resolución 2706 de 2025 (anexos técnicos 1 a 7) | MinSalud · CO | 23-12-2025, vigente desde 2026-01-01 | es | **9 459** subcategorías en el Anexo 2 (lista tabular) + ~600 en los anexos 3 a 7 (8 + 71 + 168 + 292 + 63 códigos, conteo aproximado por patrón) | Capítulos por sistema/tipo (01 a 99; 23–24 «Procedimientos en dientes» = 134). Descriptores con prestador («por especialista en…») | por ley. Acto administrativo. El art. 41 de la Ley 23/1982 que cita `SOURCES.md` **no se re-verificó hoy** (secretariasenado.gov.co no conecta) | **Reemplaza las dos copias de GitHub** por el original. PDF con texto (no escaneado): se extrae con `pdftotext -layout`. |
| `co-minsalud-pbs-procedimientos` | «Procedimiento del PBS» (datos abiertos, id `9zcz-bjue`) | MinSalud · CO | filas actualizadas el 2023-07-27 | es | **8 114** CUPS; 7 492 siguen en la CUPS 2026; **8 109 con «Qué es»** (explicación en lenguaje llano) | Zona anatómica | sí: CC BY-SA 4.0 (metadatos de la API Socrata: <https://www.datos.gov.co/api/views/9zcz-bjue.json>) | Aporta lo que nadie más tiene: **descripción para el paciente en castellano** y cobertura PBS/UPC. CC BY-SA obliga a atribuir y a compartir igual lo derivado de *ese* texto. |
| `es-mu-sms-precios-publicos-2026` | Orden de 17-06-2026, precios públicos del Servicio Murciano de Salud | CARM · ES | BORM n.º 140, 20-06-2026 | es | ~3 559 líneas con precio (≈1 300 GRD) | Sí, por secciones: E.2 laboratorio, **E.3 Catálogo normalizado de radiología**, **E.4 Pruebas funcionales y exploraciones por servicio**, E.5 salud mental | por ley | **La más reciente.** Buena para pruebas diagnósticas y exploraciones. |
| `es-pv-osakidetza-tarifas-2026` | Libro de Tarifas 2026 (+ acuerdo en BOPV n.º 9, 15-01-2026) | Osakidetza · ES | 2026 | es (también en eu) | **4 534** códigos de artículo (≈1 084 filas GRD) | Sí: anexos de laboratorio (707), rayos (1 141), rehabilitación (195), hospital de día (516), hemoterapia (326) y servicios | por ley (acuerdo de un organismo público). El aviso legal de euskadi.eus no se pudo leer (404) | Muy completa; el código de artículo es estable. |
| `es-an-sas-precios-publicos-2024` | Orden de 24-05-2024, precios públicos del SSPA | Junta de Andalucía · ES | BOJA n.º 108, 05-06-2024 | es | **4 872** filas (1 334 GRD; 2 744 de imagen B3.2; 142 de anatomía patológica; 91 «otros procedimientos» B3.5) | **Sí: B3.5 está agrupado por especialidad** (Alergia, Aparato Digestivo, Cardiología, Hematología…) | por ley | Excelente para procedimientos por especialidad e imagen. |
| `es-md-precios-publicos-2023` | Orden 1975/2023, precios públicos de la Comunidad de Madrid | Comunidad de Madrid · ES | BOCM n.º 310, 30-12-2023 | es | 2 584 epígrafes (1 332 de hospitalización GRD; **892 ambulatorios**; 56 de primaria; 304 de hemoterapia/tejidos/genética) | Parcial: los procedimientos de CMA vienen **con su código CIE-10-ES** y las pruebas con código del catálogo SERMAS | por ley | Es el **puente CIE-10-ES ↔ servicio con nombre de tienda**. |
| `es-vc-ley20-2017-tasas-sanitarias` | Ley 20/2017 de tasas, Título XXIX cap. I (tasa por asistencia sanitaria), **texto consolidado BOE** | Generalitat Valenciana · ES | consolidado a 10-08-2026 (Ley 5/2026) | es | ~1 617 códigos únicos (P01 radiología 497; PR* procedimientos ≈1 050) | Sí, por cuadros (art. 29.1-10 apartados 3 a 31: radiología, cardiología, digestivo…) | sí: condiciones de reutilización del BOE + LPI art. 13 | Hay HTML y XML (API de datos abiertos del BOE). El texto consolidado repite versiones anteriores de algunos artículos: al parsear hay que tomar sólo la «última actualización». |
| `es-ct-ics-precios-publicos-2020` | Orden SLT/71/2020, precios públicos del Instituto Catalán de la Salud (**versión en castellano del DOGC**) | Generalitat de Catalunya · ES | DOGC n.º 8153, 12-06-2020 | es | ~4 336 líneas con precio (1 304 GRD) | Sí: II.5.C «Gabinetes de atención especializada» por especialidad (neurofisiología, ojo y anexos…), hemodinámica, endoscopia, ASSIR | por ley | No encontré una orden posterior que la derogue: **vigencia no confirmada**. |
| `es-cn-scs-precios-publicos-2026` | Resolución de 14-08-2026 que actualiza el Anexo I del Decreto 81/2009 | Servicio Canario de la Salud · ES | BOC n.º 178, 04-09-2026 | es | ~582 prestaciones con código SEFLogiC | Sí: grupos por servicio (3.12 Digestivo, 3.13 Medicina nuclear…) | por ley | Breve y actual. sede.gobiernodecanarias.org cortó la conexión en el primer intento; el segundo funcionó. |
| `es-ingesa-precios-2013` | Resolución de 19-07-2013, precios de INGESA (Ceuta y Melilla) | INGESA (Estado) · ES | BOE-A-2013-8240 (modificada por BOE-A-2018-1682, que no se bajó) | es | ~876 líneas con precio | Parcial | sí: BOE | Antigua, pero estatal y bien estructurada. |
| `es-ga-sergas-tarifas-2014` | Decreto 56/2014, tarifas del SERGAS (versión en castellano del DOG) | Xunta de Galicia · ES | DOG n.º 96, 21-05-2014 | es | ~540 líneas con precio (anexos I a V, con genómica) | Parcial | por ley | No encontré una actualización posterior: **vigencia no confirmada**. |
| `es-sns-cartera-servicios-rd1030-2006` | RD 1030/2006, Cartera de servicios comunes del SNS (consolidado) | Ministerio de Sanidad (BOE) · ES | consolidado a 31-07-2026 | es | prosa (sin códigos) | Por área asistencial, incluida **salud bucodental** | sí: BOE | Sirve como **esqueleto de áreas** y para validar qué ofrece el sistema público. No sirve como lista de ítems. |
| `es-isfas-prestaciones-dentarias-2026` | Solicitud de prestaciones dentarias 2026 | ISFAS (Ministerio de Defensa) · ES | 2026 | es | 11 categorías (prótesis completa, prótesis superior/inferior, coronas, empastes, sellado, endodoncia, ortodoncia, tartrectomía, implantes…) | Odontología | no: formulario sin licencia; dato administrativo público | Sólo como vocabulario; no tiene códigos. |
| `ar-pami-nomenclador-comun` | Nomenclador de prácticas médicas, «Nomenclador Común» (CSV + Res. 432/2019) | INSSJP-PAMI · AR | «Estructura unidades febrero 2019» | es | **4 739** prácticas (código de 6 dígitos estilo Nomenclador Nacional) | Sí, por «módulo» y capítulo del código (34 = radiología, 77 = laboratorio, 12 = ORL…) | sí: **CC BY 4.0** (API CKAN de <https://datos.pami.org.ar/dataset/nomenclador>; `license_id: CC-BY-4.0`) | Lo publica PAMI en su propio portal, no datos.gob.ar (que da 502). Resuelve el pendiente de la sesión anterior. El CSV está en Latin-1 y las mayúsculas son las originales. |
| `cl-fonasa-mle-2026-npm` | FONASA MLE 2026 (copia npm, la misma que ya usa el corpus) | FONASA · CL (transporte: paquete npm de terceros) | 2026 | es | **2 515** | Grupos 01 a 33. **La copia no trae el grupo 27** | MIT para el paquete (registro npm). El documento oficial no se pudo leer (fonasa.gob.cl, adjuntos.fonasa.gob.cl y el Diario Oficial dan 403) | El SHA-256 del tgz coincide con `SOURCES.md` (`b622019b…`). |
| `icd10pcs-2027` | ICD-10-PCS FY2027 codes file | CMS · US | FY2027 (vigente desde 2026-10-01) | en | **79 256** | No | **no**: no encontré una declaración explícita de dominio público; es obra del gobierno federal de EE. UU., pero no lo verifiqué con una cita de CMS | Sólo para cruce con la CIE-10-ES. No sirve como texto de la interfaz. |
| `hcpcs-2026q4` | HCPCS Level II, archivo alfanumérico de octubre 2026 | CMS · US | 2026-10 | en | **8 770** códigos | No (categorías por letra) | **no** explícita. El `recordlayout` del zip advierte que Level I es CPT (© AMA) y la serie D es CDT (© ADA): **verifiqué que el archivo no trae ningún código D** | Mayormente insumos y DME. Utilidad baja para servicios de práctica. |

### 2.2 Evaluadas y NO descargadas

| Fuente | Organismo | Alcanzable | Licencia (cita) | Motivo |
|---|---|---|---|---|
| **WHO ICHI** | OMS | Sí (navegador `icd.who.int/dev11/l-ichi/en`; guía de referencia en PDF) | **CC BY-ND 3.0 IGO**: «you are NOT permitted to make "adaptations"» (<https://icd.who.int/en/docs/icd11-license.pdf>, §1.2) | Sigue siendo Beta-3 (2020) en la plataforma «dev», que avisa que el contenido puede cambiar. **No hay versión en castellano** (`/l-ichi/es` da 404). No hay descarga masiva; la API pide registro. La licencia ND prohíbe adaptar (traducir). Descartada. |
| **SNOMED CT** | SNOMED International | — | Bolivia **no es miembro**: la lista <https://www.snomed.org/members> incluye Argentina, Chile, Costa Rica, España y Uruguay, pero no Bolivia. Fuera de los países miembro se exige licencia de afiliado anual vía MLDS, que puede tener costo (<https://www.snomed.org/get-snomed>) | Propietaria para Bolivia. Excluida. |
| CPT / CDT | AMA / ADA | — | Propietarias | Excluidas por pedido. |
| Australia **MBS** | Dept. of Health | Sí (XML en la página de descargas) | «only for your personal, non-commercial use and only in an unaltered form» (<https://www.mbsonline.gov.au/internet/mbsonline/publishing.nsf/Content/Copyright>) | Licencia inaceptable; además está en inglés. |
| **FONASA MLE oficial / MAI** | FONASA / MINSAL · CL | **No**: 403 en fonasa.gob.cl, adjuntos.fonasa.gob.cl y diariooficial.interior.gob.cl; web.archive.org no conecta | MLE: Res. Exenta 347 del 03-03-2026 (D.O. 14-03-2026). MAI: Res. 32/2021 modificada por la Res. Exenta 403 del 06-03-2026 (D.O. 25-03-2026), según resultados de búsqueda | Seguir con la copia npm verificada. Para la MAI no hay transporte. |
| **CUPS vía SISPRO** (tabla de referencia) | MinSalud · CO | No (web.sispro.gov.co cierra el túnel) | — | La sustituye el PDF oficial de la Res. 2706/2025. |
| **SIGTAP** | DATASUS · BR | Sólo el sitio (HTTP 200). Las tablas están en `ftp://ftp2.datasus.gov.br`, que el proxy no permite | — | En portugués y sin traducción oficial. No se descargó. |
| CCAM | Assurance Maladie · FR | ameli.fr da 403. Hay una copia de InterHop en data.gouv.fr (Licence Ouverte v2.0, «lov2»), pero static.data.gouv.fr cortó la conexión | lov2 según la API de data.gouv.fr (sin leer el texto de la licencia) | En francés. Utilidad baja. |
| OPS 2026 | BfArM · DE | Sí (portal) | **No verificada**: la página de descargas no mostró las condiciones | En alemán. Utilidad baja. |
| OPCS-4 | NHS England (TRUD) | Sí (TRUD, requiere cuenta) | **No verificada**: TRUD no muestra el nombre de la licencia sin iniciar sesión | En inglés. Utilidad baja. |
| CPMS Perú | MINSA · PE | minsa.gob.pe da 403 | — | Según el registro anterior es un derivado de CPT (AMA). **No re-verificado hoy.** Excluido por riesgo de licencia. |
| Tarifario de Ecuador | MSP · EC | salud.gob.ec responde; sólo encontré PDFs 2012/2014 en sitios no oficiales | — | Según el registro anterior usa CPT. La vigencia del tarifario 2014 frente al 2020 no está clara. No descargado. |
| Uruguay (MSP) | MSP · UY | No (msp.gub.uy no conecta) | — | — |
| México CIE-9-MC (DGIS) | DGIS · MX | El sitio responde, pero no encontré el archivo; datos.gob.mx da «Access Denied» | — | Además, la CIE-9-MC vol. 3 quedó superada por la CIE-10-ES/PCS. |
| Navarra (tarifas del SNS-O desde 2026-07-01) | Gobierno de Navarra | No (bon.navarra.es y navarra.es no conectan) | — | Pendiente. El BOE replica algunos BON en `boe.es/ccaa/bon/…`, pero no encontré esta orden ahí. |
| Aragón (Orden SAN/923/2025, tarifas máximas con medios ajenos, BOA n.º 148, 04-08-2025) | Gobierno de Aragón | boa.aragon.es responde | por ley | No llegué a descargarla. **Siguiente candidata.** |
| Baleares, Castilla y León (Decreto 78/2008), Castilla-La Mancha (orden 2014), Asturias, Cantabria, La Rioja, Extremadura | CCAA | Varias no conectan (Asturias, Cantabria, La Rioja, Castilla y León) | por ley | Identificadas pero no descargadas: o son antiguas o el sitio no conecta. |
| MUFACE (ayudas dentarias) | MUFACE | — | — | Mismo esquema que ISFAS (unas 10 categorías). No aporta más. |

## 3. Odontología (el hueco más grande)

**No existe**, entre lo que se puede reutilizar, un catálogo odontológico grande, oficial y en castellano. CDT (ADA) es propietario. Lo que sí hay:

1. **CUPS 2026, códigos 23.x y 24.x «Procedimientos en dientes»: 134 subcategorías.** Hay más ítems odontológicos repartidos en otros capítulos: consultas de odontología e higiene oral, radiología dental en el 87 y 18 menciones de «odontología» o «higiene oral» en todo el documento. Es la mejor base.
2. **CIE-10-ES Procedimientos**: los procedimientos sobre dientes y encías (por ejemplo extracción, reposición e implante de diente) tienen códigos exactos. Sirven para completar y mapear, pero con nombres técnicos.
3. **Arancel odontológico BO 2026** (113, ya cargado): da los nombres de mercado en Bolivia.
4. Listas cortas en castellano: ICS (revisión odontológica, extracción de cordal semiincluido e incluido), Osakidetza (extracción dental, radiografía apical), Valencia (ortopantomografía, cone beam dental, cefalometría), Andalucía (TC dental), PAMI (práctica quirúrgica odontológica con anestesia general), ISFAS/MUFACE (11 categorías de tratamiento).
5. **FONASA**: la copia npm **no trae el grupo 27**, así que lo odontológico de FONASA no está en el corpus.

Para Odontología, la recomendación es: CUPS 23–24 como columna, nombres del arancel BO, y CIE-10-ES para desambiguar. Cualquier faltante que quede después de eso exige curación manual con revisión clínica: no aparece en ninguna fuente abierta adicional.

## 4. Ranking: «¿cuál es el mejor repositorio?»

No hay uno solo que sirva. El mejor resultado sale de **combinar tres capas**:

| # | Capa | Fuente(s) | Por qué |
|---|---|---|---|
| 1 | **Columna vertebral clínica en castellano (exhaustiva)** | **CIE-10-ES Procedimientos 2026** | 78 948 procedimientos con traducción oficial y licencia de reutilización clara. Es el único sistema que cubre *todo* lo quirúrgico e intervencionista. Su debilidad: nombres técnicos y ningún eje por especialidad. Se carga como **referencia** (concepto + código), no como texto visible principal. |
| 2 | **Catálogo de servicios con lenguaje de práctica** | **CUPS 2026 (Res. 2706/2025)** + **PBS «Qué es»** | 9 459 procedimientos oficiales vigentes, redactados como servicios («consulta de primera vez por especialista en…», «exodoncia de diente permanente…»), con capítulo y prestador en el texto. Es lo más parecido a una «tienda». El dataset PBS agrega una **explicación para el paciente** en 8 109 ítems (CC BY-SA). |
| 3 | **Servicios como se cobran en sistemas públicos hispanohablantes, con eje por especialidad** | Órdenes de precios: **Murcia 2026, Osakidetza 2026, Andalucía 2024, Valencia (consolidada 2026), Madrid 2023, ICS 2020, Canarias 2026**, más INGESA y Galicia; **FONASA MLE 2026** (ya cargado) y **PAMI** (CC BY 4.0) | Aportan consultas, pruebas funcionales por servicio, imagen, laboratorio, hospital de día y rehabilitación, con nombres comerciales y agrupados por especialidad. Ahí CIE-10-ES y CUPS son pobres o demasiado técnicos. Madrid ya trae el **código CIE-10-ES** de cada procedimiento de CMA: eso permite enlazar las capas 1 y 3 sin inferir. Se excluyen los GRD. |
| — | Sólo para cruces | ICD-10-PCS FY2027, HCPCS | En inglés. Sirven para validar la CIE-10-ES contra el original y para mapear. **No** van a la interfaz. |
| — | Descartadas | SNOMED CT, CPT, CDT, MBS, ICHI, CPMS, tarifario de Ecuador, SIGTAP, OPS, OPCS-4, CCAM | Por licencia (propietaria, no comercial o sin derivados), por idioma o por ser derivadas de CPT. |

### Orden de carga recomendado

1. **CUPS 2026 oficial** (`co-cups-2026-res2706`). Parsear el Anexo 2 y los anexos 3 a 7 del PDF y **reemplazar el transporte de las dos copias de GitHub**: los ids no cambian, porque dependen del código. Volver a correr las reglas de especialidad por descriptor sobre la versión vigente. Cruzar con `co-minsalud-pbs-procedimientos` para agregar la propiedad «qué es» (con atribución CC BY-SA) y marcar los 1 967 códigos CUPS 2026 que no están en el PBS.
2. **Murcia 2026 + Osakidetza 2026 + Andalucía 2024**, sin GRD. Son las más completas y recientes, con secciones por servicio. Cada sección se asigna a una especialidad del modelo por tabla de reglas, igual que `boArancelHeadings`. Sirven de **evidencia de especialidad** para conceptos que CUPS no asigna.
3. **Madrid 2023**: el puente CIE-10-ES ↔ procedimiento de CMA. Cargar antes la CIE-10-ES (paso 4) o en el mismo lote.
4. **CIE-10-ES Procedimientos 2026** como sistema de referencia completo, reutilizando `import-cie10es.mjs`. Enlazar sólo lo que tenga evidencia (Madrid, o un código citado por otra orden); el resto queda buscable sin especialidad.
5. **Valencia (consolidado), ICS 2020, Canarias 2026, INGESA, Galicia**: aportes incrementales. Deduplicar por nombre normalizado contra los pasos 2 y 3.
6. **PAMI** (CC BY 4.0, 4 739). Usar el capítulo del código (Nomenclador Nacional) como eje.
7. Odontología según la sección 3.
8. Pendientes: Aragón SAN/923/2025 (alcanzable), Navarra 2026 y FONASA oficial/MAI (bloqueados), CatSalut SLT/63/2020 (no la busqué en el DOGC).

### Advertencias

- Ninguna orden española trae una **licencia explícita**: su reutilización se apoya en LPI art. 13 (norma pública), y en el caso del BOE, además, en sus condiciones de reutilización. Hay que citar fuente y fecha.
- Los **precios** de las órdenes son de facturación a terceros obligados al pago en España. **No** son precios de referencia para Bolivia: sirven como dato, no como sugerencia de precio.
- Los conteos de los PDF se hicieron por patrón de texto (líneas con importe o códigos únicos). Son aproximados, salvo los de CIE-10-ES, ICD-10-PCS, HCPCS, PBS, PAMI y FONASA, que se contaron sobre datos estructurados.
- El ICS 2020 y el SERGAS 2014 podrían haber sido actualizados por normas que no encontré: **vigencia no confirmada**.
