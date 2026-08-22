# Datos de Bolivia — qué se cargó, qué no, y por qué

Fecha: 2026-08-22 · Origen: `markdown_convertidos/` (diez tablas del stakeholder,
7 186 filas) contrastado contra `REGISTRO DE PROCESOS POR MODULO.md`.

## Resumen

De los diez listados, **cinco están cargados y verificados contra la base viva**.
Los otros dos conjuntos —aranceles y redes de prestadores— quedan entregados como
datos, sin cargar, cada uno por un motivo concreto que se explica abajo. No es
que falte trabajo: es que cargarlos hoy afirmaría cosas que no son ciertas.

## Lo que quedó cargado

| Qué | Cuánto | Dónde vive | Qué del registro de procesos resuelve |
|---|---|---|---|
| Catálogo de estudios | 88 | `clinical.service_requests.code_concept_id` | PACIENTE §5.1.2 y §5.1.3 — «Orden para Laboratorio», «Orden para análisis clínicos» |
| Ejes de la orden (estado, intención, prioridad, categoría) | 17 | los otros 4 campos de `service_requests` | idem |
| Formas societarias | 8 | `directory.tenants.legal_entity_type_concept_id` | MEDICO §2.1.1 y los 4 módulos de proveedor — «SOLO SELECCIONAR AL REGISTRAR, UNIPERSONAL, SRL, LTDA, S.A. …» |
| Aseguradoras | 25 (17 privadas + 8 públicas) | `insurance.insurance_carriers` + producto + plan | PACIENTE §1.13.1 y §1.14.1 — «aquí tienen que estar registrado… todas las compañías de seguro» |
| Establecimientos de salud | 503 | conjunto `VS_BO_HEALTH_FACILITY` | MEDICO §3.1 y §3.2 — «los hospitales públicos que esta de turno… las diferentes clínicas privadas» |

Verificado contra el stack `mantra-redesa` tras reconstruir la imagen: los 15
pasos del seed en verde, `failed=0`.

### El catálogo de estudios cerraba un flujo caído

`clinical.service_requests` tenía sus cinco columnas de catálogo **sin una sola
opción publicada**, y `code_concept_id` es NOT NULL. La pantalla de órdenes
respondía «El catálogo de estudios no está publicado» y pedir un laboratorio o
una radiografía era imposible de punta a punta.

Ahora los cinco ejes resuelven: 88 estudios, 5 categorías, 3 intenciones, 4
prioridades y 5 estados.

**Los códigos son locales (`LAB_*`, `IMG_*`, `CAR_*`, `PAT_*`, `PRO_*`), no
LOINC**, y eso es deliberado. LOINC identifica una *medición* con su método, su
unidad y su espécimen; lo que el médico pide y el laboratorio cobra es un
*servicio*. Traducir uno al otro es una decisión clínica, no una transcripción, y
un código LOINC mal elegido es peor que ninguno: queda un identificador que
parece interoperable y no lo es. Cuando el laboratorio entregue su nomenclador
—que el registro de procesos ya prevé— se publica una versión nueva del conjunto
y el amarre la sigue sin tocar código.

### Los establecimientos son un conjunto de valores, no organizaciones

Son un **directorio de consulta**. El registro de procesos describe con detalle
cómo se da de alta una organización de verdad —razón social, forma societaria,
NIT, SEPREC, licencia de funcionamiento, certificado del SEDES, poder del
representante legal, GPS de cada sucursal— y ninguno de esos 503 pasó por ahí.
Crearlos como `directory.tenants` los daría por registrados sin que nadie los
registrara, y dejaría el alta real sin trabajo que hacer.

### Las aseguradoras sí son organizaciones, y no por elección

`insurance.insurance_carriers.tenant_id` es **ÚNICO**: el modelo no admite dos
aseguradoras en la misma organización. Una compañía sin tenant no se puede
representar. Así que el seed crea 25 tenants, con verificación **sin verificar**
a propósito: nadie presentó documentación. Que existan hace que el alta real
*reclame* el registro en vez de crear un duplicado del mismo seguro.

Se siembra la cadena entera —aseguradora → producto → plan— porque
`insurance.patient_coverages` apunta al **plan**, no a la compañía: cargar sólo
las compañías dejaría la lista llena y la cobertura igual de imposible de
registrar.

Los planes no se inventan: `AFI Gold`, `Oasis` y `Silver` son los que nombra la
red de Alianza, y `Salud Flexible` el de Nacional Seguros. Las 21 compañías que
todavía no publicaron su red reciben un plan `BASE` con el nombre de la
compañía — existe la cobertura, no se conoce su denominación comercial.

Las 12 aseguradoras demo del generador (`Aseguradora Horizonte Salud Demo`…)
**no se tocaron**: hay filas de prueba colgando de ellas.

## Lo que NO se cargó, y por qué

### 1 · Aranceles (4295 honorarios médicos + 113 odontológicos)

**No hay tabla destino en el modelo.** El arancel de honorarios del Colegio
Médico es un *pliego profesional por especialidad en UMA*, y las tres tablas de
precios que existen son otra cosa:

- `payments.fee_schedules` — las comisiones de AloVida, no honorarios médicos.
- `diagnostic_units.diagnostic_study_prices` — exige
  `diagnostic_study_offering_id`, o sea el precio de **un centro concreto**, no
  un arancel de referencia.
- `pharmacy.pharmacy_product_prices` — medicamentos.

Crear la tabla es decisión del modelo, y `check_ddl_sources.py` prohíbe declarar
un `CREATE TABLE` desde el repositorio de la API. Queda entregado el dataset.

**Además, el PDF es escaneado.** Su propia hoja de metadatos lo advierte: «La
extracción se realizó mediante OCR; conviene validar nombres, acentos, códigos y
UMA antes de cargar a producción». Se le nota —«Anestesiblogos», «Térax»,
«cardiol6gico», «Gréneo»—. El extractor marca 228 filas con
`ocrSospechoso: true`, pero **ese detector encuentra sólo el daño evidente**
(mezcla de letras y dígitos): «Térax» por «Tórax» no lo detecta ninguna regla
sin un diccionario. Tratar la cifra como cobertura sería engañarse.

Por eso los estudios por imagen del catálogo se escribieron **a partir de los
grupos del arancel** (tórax, cráneo y cara, columna, miembros, contrastados,
ecografía, doppler, densitometría, tomografía, resonancia) con los nombres
correctos, en vez de volcar el texto crudo.

### 2 · Redes de prestadores (961 médicos)

| Aseguradora | Profesionales | Planes |
|---|---|---|
| Alianza | 454 | ACC. PERSONALES, AFI GOLD, OASIS, SILVER |
| Nacional Seguros | 507 | SALUD FLEXIBLE |

Son 1 416 filas en origen que agrupan a 961 médicos distintos: cada uno aparece
una vez por sede y por plan.

**No se cargaron porque serían cuentas de personas que nunca se registraron.**
`insurance.network_provider_memberships.provider_entity_id` exige un prestador
real, o sea crear 961 `health_practitioner_profiles` con nombre y dirección de
consultorio de gente que no dio su consentimiento. Es el mismo criterio que con
los establecimientos, pero acá además hay personas de por medio.

Lo que sí es correcto y queda pendiente de decisión: publicarlas como
**directorio de consulta** —igual que los establecimientos—, que es lo que el
registro de procesos pide en PACIENTE §3.2 («Desde la APP pueden revisar cuales
son los médicos que trabajan con cada aseguradora») sin necesidad de que esos
médicos tengan cuenta.

### 3 · Los dos listados de personas

`USUARIO_MEDICOS_1.md` (170) y `USUARIO_PACIENTES_1.md` (165) traen **cédulas de
identidad, fechas de nacimiento, teléfonos, correos y domicilios de personas
reales**. No se convirtieron a dataset ni se cargaron, y el extractor no los
toca.

Van por el registro, no por un seed: es exactamente la diferencia que el registro
de procesos describe entre «Registro en la App (si es que inicia el por su propia
cuenta)» y «Registro en la App (con el link que envié el medico)». Un seed los
dejaría en el repositorio, en cada máquina del equipo y en cada base que alguien
levante.

## Brechas que este trabajo destapó

### A · Deriva de esquema en el camino del registro — **CORREGIDA**

Dos commits del 21-ago promovieron seis columnas al ORM sin materializarlas:

- `ceba7c4d` — `persons.occupation_concept_id`, `persons.occupation_free_text`,
  `identifiers.issuer_administrative_area_concept_id`,
  `addresses.municipality_concept_id`
- `880857d6` — `insurance_carriers.sigla`, `insurance_carriers.address`

Es el mismo defecto que rompió las recetas en v4.1.3. **Comprobado en runtime**,
no deducido: un alta de paciente enviando el departamento emisor de la cédula
devolvía **HTTP 500** con
`column "issuer_administrative_area_concept_id" of relation "identifiers" does
not exist`. El alta *sin* ese campo devolvía 201, así que el fallo sólo aparecía
cuando la persona completaba el desplegable — la peor forma de tenerlo.

Corregido en las cuatro capas (`.puml` → `SQL/` → BD → ORM). El patch para bases
vivas es `2026-08-22_v414_catalogo_boliviano_y_aseguradora.sql`, en esta misma
carpeta. Tras aplicarlo, el mismo alta devuelve **201** y guarda «Chuquisaca» y
la ocupación.

### B · `VS_BO_OCCUPATION` no existe

El registro de procesos pide las **896 ocupaciones del SEGIP** con búsqueda por
lupa, cuatro veces (PACIENTE §1.4, §2.4; MEDICO §1.4, §5.7). El front ya
referencia `VS_BO_OCCUPATION` y el ORM ya tiene la columna, pero **el catálogo no
está en ninguno de los diez markdown**. Hay que conseguir la lista del SEGIP.

Mientras tanto `occupation_free_text` funciona, que es la «entrada libre al
final» que el propio registro pide.

### C · Sigla de Pando: `PD` contra `PA`

`bo-geography.catalog.ts` declara `PD` para Pando; el listado del stakeholder
dice `PA`. `PD` es la sigla estándar de la cédula boliviana. **No se cambió** —
es una pregunta para quien armó el listado, no una corrección obvia.

### D · Especialidades: el catálogo tiene 36, en el mercado hay más

`VS_MEDICAL_SPECIALTY` lo siembra el paquete del modelo, fuera de git. Ampliarlo
desde la API dejaría dos dueños del mismo conjunto — el problema que ya
documentó el módulo 64. Queda el contraste, para que lo resuelva quien es dueño:

| Apariciones | Especialidad observada | Origen |
|---|---|---|
| 318 | Neurocirugía | red-alianza, red-nacional, arancel |
| 267 | CIRUGIA PEDIATRICA | red-nacional, arancel |
| 258 | Otorrinolaringología y Cirugía de Cabeza y Cuello | arancel |
| 239 | CIRUGIA PLASTICA ESTETICA Y RECONSTRUCTIVA | red-nacional, arancel |
| 219 | Cirugía Cardíaca, Torácica y Vascular | arancel |
| 155 | RADIOLOGIA | red-nacional, arancel |
| 117 | Terapia Intensiva Pediátrica | arancel |
| 68 | NEUROLOGIA PEDIATRICA | red-nacional, arancel |
| 64 | Gastroenterología y Endoscopía Digestiva | arancel |
| 63 | Emergenciología | arancel |
| 53 | COLOPROCTOLOGIA | red-nacional, arancel |
| 51 | Ortopedia y Traumatología | red-alianza |
| 49 | Medicina Física y Rehabilitación | arancel |
| 47 | Medicina Crítica y Terapia Intensiva | arancel |
| 44 | Fisioterapia | red-alianza |
| 39 | Mastología | red-alianza, arancel |
| 34 | Anestesiología, Reanimación y Dolor (anexo) | arancel |
| 31 | Cirugía Laparoscópica | red-alianza |
| 28 | Endocrinología, Metabolismo y Nutrición | arancel |
| 20 | PEDIATRIA NEONATOLOGIA | red-nacional |
| 18 | Psicologia | red-alianza |
| 17 | Patología | arancel |
| 14 | Cirugía cardiovascular | red-alianza, red-nacional |
| 12 | GINECOLOGIA Y OBSTETRICIA MASTOLOGIA | red-nacional |
| 11 | Neonatología | red-alianza |
| 11 | Salud Pública | arancel |
| 10 | Proctología | red-alianza |
| 9 | CIRUGIA TORACICA Y CARDIOVASCULAR | red-nacional |
| 9 | Cirugía Pediatra | red-alianza |
| 9 | Cirugía Vascular | red-alianza, red-nacional |
| 9 | Nutricionista | red-alianza, red-nacional |

**Ojo al leerla**: varias son la misma cosa con otro nombre. «Ortopedia y
Traumatología» y «Traumatología y Ortopedia» son una sola, y ésta última **ya
está** en el catálogo. La tabla es material para curar a mano, no una lista de
altas.

## Cómo regenerar los datasets

    python tools/bolivia-datasets/extract_datasets.py

Lee `markdown_convertidos/` y escribe `src/common/seed/data/bolivia/`. Existe
como script y no como una conversión hecha una vez porque el stakeholder va a
mandar versiones nuevas: cuando pase, se vuelve a correr y se diffea el JSON.

### E · La copia del modelo de esta máquina está atrasada respecto a F-15

`yarn test` deja **3 pruebas en rojo** en `diagnostic_units.indexes.spec.ts`, y **no son de
este trabajo**. El spec exige que el modelo ya no declare `uq_diagnostic_units_tenant_id` ni
`uq_diagnostic_units_code` por separado, sino una sola compuesta sobre `(tenant_id, code)`.
Esa corrección es F-15 y el propio spec la documenta.

Pero en esta máquina las tres capas del modelo siguen con la regla vieja:

| Capa | Qué declara |
|---|---|
| `Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:241-242` | las dos UK por separado |
| `SQL/23_diagnostic_units/04_indexes.sql:5,7` | las dos UNIQUE por separado |
| bóveda · `E diagnostic_units.idxset_diagnostic_units.md:23-24` | las dos UK por separado |
| `src/orm/catalog/indexes/diagnostic_units.idx.ts:43-44` | las dos, porque se regenera de la bóveda |

**No lo corregí**, y a propósito: `Mantra Core Health Context/`, `SQL/`, `salud-db/` y la bóveda
**no son repositorios git**, así que la corrección de F-15 se hizo en otra máquina y esta copia
nunca la recibió. Arreglarlo acá sería rehacer a ciegas un trabajo que ya existe y arriesgarse a
que las dos copias diverjan. Quien tenga el modelo al día sólo tiene que confirmar que su copia
ya lo trae; con eso, `yarn orm:catalog` deja las tres pruebas en verde.

**Por qué importa para las aseguradoras.** El argumento de F-15 —«un directorio de laboratorios
con una unidad por organización no es un directorio»— vale igual para
`uq_insurance_carriers_tenant_id`, que es lo que obliga a este seed a crear un tenant por
compañía. Si esa restricción también cae, los 25 tenants dejan de ser necesarios: el seeder
seguiría funcionando igual (es idempotente y los tenants no estorban), pero se podrían
simplificar. Vale la pena decidirlo junto con la de `diagnostic_units`, porque es la misma
pregunta.
