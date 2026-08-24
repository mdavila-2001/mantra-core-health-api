# Jornada del 21–22 de agosto — todo lo que se hizo, y lo que queda para Marcelo

Registro completo de la sesión. Las tres primeras partes cuentan **qué se hizo**;
las tres últimas, **qué te toca a vos**.

---

## Resumen en una tabla

| | Antes | Después |
|---|---|---|
| Diagnósticos que el médico puede elegir | 12 | **142** |
| Medicamentos del recetario | 12 | **62** |
| Estudios de laboratorio e imagen | **0** (pantalla caída) | **88** |
| Procedimientos con precio de referencia | 0 | **4 408** |
| Establecimientos de salud | 0 | **503** |
| Aseguradoras | 12 inventadas | **25 reales** |
| Formas societarias | 1 genérica | **8** |
| Cuentas de proveedor con las que se puede entrar | 0 | **4** |
| Recetas y diagnósticos | **no se guardaban** | se guardan |
| Registro con departamento del CI | **500** | 201 |

Seis PRs, cinco mergeados. Todo verificado contra la base viva y en el navegador,
no leyendo código.

---

## 1 · Los tres fallos que estaban rompiendo cosas

Los tres son el **mismo defecto de fondo**, y conviene verlo como patrón y no como
tres accidentes: alguien promueve columnas al ORM —entidades, DTOs, servicios— y
no las materializa en `SQL/`. Con MikroORM eso no falla al arrancar: falla en el
`INSERT`, y sólo cuando el campo viene con valor.

### 1.1 · No se guardaba **ningún** diagnóstico ni receta · PR #204

El commit de v4.1.3 promovió cinco columnas al ORM y no llegaron al esquema:

```
clinical.conditions           clinical_course_concept_id
                              expected_resolution_at
                              note_text
clinical.medication_requests  indication_condition_id
                              patient_instructions_text
```

El efecto era **total**, no parcial: MikroORM las incluía en cada `INSERT` y
Postgres rechazaba la sentencia entera. En pantalla, «Error interno del servidor»
al prescribir.

Comprobado prescribiendo en el navegador: Diagnósticos 0 → 1, Medicación 0 → 1.

**Patch:** `2026-08-22_v413_clinical_notas_y_curso.sql`, en esta carpeta.

### 1.2 · El registro daba 500 al elegir el departamento del CI · PR #209

Dos commits del 21/08 (`ceba7c4d` y `880857d6`) promovieron seis columnas más:

```
common.identifiers           issuer_administrative_area_concept_id
common.addresses             municipality_concept_id
profiles.persons             occupation_concept_id · occupation_free_text
insurance.insurance_carriers sigla · address
```

Éste era **peor de encontrar que el anterior porque es intermitente**. El alta
devolvía `201` mientras nadie completara el desplegable del departamento, y `500`
en cuanto alguien lo elegía. Comprobado en runtime, no deducido:

```
POST /iam/auth/register-patient  → HTTP 500
InvalidFieldNameException: column "issuer_administrative_area_concept_id"
of relation "identifiers" does not exist
```

Tras aplicar el patch: **201**, y guarda «Chuquisaca» y la ocupación.

**Patch:** `2026-08-22_v414_catalogo_boliviano_y_aseguradora.sql`, en esta carpeta.

> Esto **complementa** tu PR #203 en vez de chocar: vos resolviste el nombre a
> favor de `issuer_*` / `VS_BO_DEPARTMENT`; lo que faltaba era que la columna
> existiera.

### 1.3 · Pedir un estudio era imposible · PR #209

Los cinco campos de catálogo de `clinical.service_requests` **no tenían ni una
opción publicada**, y `code_concept_id` es NOT NULL. La pantalla respondía «El
catálogo de estudios no está publicado» y la orden de laboratorio o imagen no se
podía emitir de punta a punta.

No era un fallo de esquema sino de datos: nadie había publicado las enumeraciones.

---

## 2 · Los catálogos que se cargaron

Todos salen de `markdown_convertidos/` —los diez archivos del stakeholder, 7 186
filas— contrastados uno por uno contra `REGISTRO DE PROCESOS POR MODULO.md` para
saber a dónde iba cada cosa.

### 2.1 · De los markdown, tal cual

| Catálogo | Filas | Qué del registro de procesos resuelve |
|---|---|---|
| **Procedimientos con precio** | 4 408 | PACIENTE §5 — «Cuál es el costo de los medicamentos / de los análisis» |
| **Establecimientos de salud** | 503 | MEDICO §3.1 y §3.2 — «los hospitales públicos que esta de turno… las clínicas privadas» |
| **Aseguradoras privadas** | 17 | PACIENTE §1.13.1 — «aquí tienen que estar registrado… todas las compañías de seguro» |

Los 503 son 22 clínicas privadas, 10 hospitales públicos de 2.º y 3.º nivel, 7
cajas de la seguridad social y 464 centros de primer nivel de 55 municipios.

Los 4 408 son 4 295 honorarios médicos en UMA y 113 odontológicos en dólares.

### 2.2 · Escritos a partir del registro de procesos

| Catálogo | Filas | De dónde salen |
|---|---|---|
| Seguros públicos y cajas | 8 | CNS, CPS, COSSMIL, CORDES, Caminos, Banca Privada, SSU, SUS |
| Formas societarias | 8 | La lista literal del registro: UNIPERSONAL, SRL, LTDA, S.A., Colectiva, Comandita Simple, Comandita por Acciones, Sucursal Extranjera |

El registro de procesos pide las formas societarias en **cinco módulos** con las
mismas palabras —«SOLO SELECCIONAR AL REGISTRAR»— y da el motivo: *«para poder
tener DATA de cuántos proveedores tenemos con SRL, UNIPERSONAL y S.A.»*. Escrito a
mano, ese dato no se puede contar.

### 2.3 · Escritos por criterio clínico

| Catálogo | Filas | Nota |
|---|---|---|
| **Estudios** (laboratorio, imagen, cardiología, patología, procedimientos) | 88 | Los de imagen siguen los grupos del arancel, con los nombres escritos correctamente |
| **Ejes de la orden** (estado, intención, prioridad, categoría) | 17 | |
| **Diagnósticos CIE-10** | 130 nuevos | Por aparato, más síntomas (R) y motivos de contacto sin enfermedad (Z) |
| **Vademécum** | 50 nuevos | Códigos ATC reales de la OMS |
| **Ejes de la nota clínica** | 7 conceptos, 3 conjuntos | Tipo, ciclo de vida y visibilidad para el paciente |

Cada uno lleva su explicación en castellano, que **no es para el médico** —sabe
qué es una gonartrosis— sino para el glosario que lee el paciente: «Desgaste del
cartílago de la rodilla, con dolor al caminar».

**Por qué los estudios usan códigos locales (`LAB_*`, `IMG_*`) y no LOINC:** LOINC
identifica una *medición* con su método, su unidad y su espécimen; lo que el
médico pide y el laboratorio cobra es un *servicio*. Traducir uno al otro es una
decisión clínica, no una transcripción, y un LOINC mal elegido es peor que ninguno
— queda un identificador que parece interoperable y no lo es. El vademécum y los
diagnósticos sí usan códigos reales (ATC y CIE-10) porque ahí la equivalencia es
directa.

### 2.4 · Tres decisiones de modelado que conviene mirar

**Las aseguradoras crean 25 tenants, y no por gusto.**
`insurance_carriers.tenant_id` es ÚNICO: el modelo no admite dos aseguradoras en
la misma organización, así que una compañía sin tenant no se puede representar.
Nacen **sin verificar** —nadie presentó documentación— y existen para que el alta
real *reclame* el registro en vez de duplicar el seguro.

**Los 503 establecimientos NO son tenants**, por lo contrario exacto: son un
directorio de consulta y ninguno recorrió el alta que el registro de procesos
describe —razón social, SEPREC, licencia, SEDES, poder del representante legal—.
Crearlos como organizaciones las daría por registradas sin que nadie las
registrara. Van como el conjunto `VS_BO_HEALTH_FACILITY`.

**Se siembra la cadena entera de seguro** (aseguradora → producto → plan) porque
`insurance.patient_coverages` apunta al **plan**, no a la compañía: cargar sólo
las aseguradoras dejaría la lista llena y la cobertura igual de imposible de
registrar. Los planes no se inventan: `AFI Gold`, `Oasis` y `Silver` son los que
nombra la red de Alianza, y `Salud Flexible` el de Nacional Seguros.

---

## 3 · Lo que se construyó

### 3.1 · Cuentas de proveedor que sí entran · PR #207

El paquete de seeds ya sembraba 16 farmacias, 6 unidades de diagnóstico y 12
aseguradoras **con sus operadores** — pero la credencial de esas cuentas quedó con
el relleno del generador (`IAM-AUTHENTICATI-000003`), que no es un identificador
que nadie pueda tipear. En los hechos, **nadie podía entrar como farmacia,
laboratorio ni aseguradora**.

Ahora hay cuatro cuentas de verdad, una por módulo de socio del registro de
procesos:

```
farmacia.demo@alovida.test      ·  laboratorio.demo@alovida.test
imagen.demo@alovida.test        ·  aseguradora.demo@alovida.test
```

Es opt-in por entorno (`SEED_DEMO_PASSWORD`) y se niega en producción salvo
permiso explícito.

### 3.2 · La hoja en blanco · PR #208 (front)

Tu tío pedía dos cosas: poder **elegir el formulario**, y que hubiera una opción
para **los médicos que sólo quieren escribir**.

Lo primero ya existía: el selector ofrecía las 44 fichas por especialidad
—«Valoración preanestésica», «Control prenatal (CLAP/SMR)», «Evaluación del riesgo
cardiovascular (OMS/OPS)»—. Lo que faltaba era lo segundo, y la forma más barata
de darlo resultó ser la misma pieza:

> **«Hoja en blanco» es una plantilla más del selector, la primera de la lista.**

No hay dos modos ni dos pantallas. El médico elige con qué va a escribir la
consulta, y una de las respuestas es «con nada».

Tres piezas nuevas: el editor (`shared/components/molecules/rich-text-editor`), el
cliente de `chart.clinical_note_*` (`core/data-access/chart-notes`) y el bloque
que los une. **Sin dependencias nuevas**: `contenteditable` más `execCommand`,
porque traer Quill o TipTap por cinco botones no entra en el presupuesto de bundle.

Lo escrito va a `chart.clinical_note_versions`, que el modelo ya tenía definido y
ningún cliente usaba. **Cada guardado crea una versión, nunca pisa la anterior.**

**No hay color, y es deliberado.** Fue lo único que se dejó fuera de lo pedido: si
un médico marca una alergia en rojo y ese rojo se pierde —impreso en blanco y
negro, dictado por un lector de pantalla, exportado a texto plano—, el énfasis
desaparece sin que nadie se entere. Hay una prueba que lo fija.

**Todavía no firma ni exporta a PDF.** Las dos existen en el modelo
(`clinical_note_signatures`, `chart.document_records`) y son las que convierten la
nota en un documento con valor legal. Hacerlas a medias sería peor que no tenerlas.

### 3.3 · Dos defectos de interfaz que esto destapó

**La tarjeta del encuentro tapaba media hoja.** `.expediente__encuentro` es
`position: sticky` —o sea, posicionado—, así que pintaba por encima de todo lo que
viniera después aunque estuviera antes en el documento. Con bloques bajos no se
notaba; con un editor de 28 rem era imposible no verlo. Ahora las filas que cruzan
las dos columnas ganan la capa.

**La pestaña «Notas» decía «Progress note type» y «Clinical note draft»** · PR
#210. No eran los rótulos: `chart.clinical_note_headers` no tenía ninguna
enumeración publicada, así que ningún concepto suyo llegaba a una pantalla y
ninguno tenía por qué estar traducido. Ahora dice «Nota de evolución» y «Borrador».

### 3.4 · Dos herramientas

**`tools/bolivia-datasets/extract_datasets.py`** — lee `markdown_convertidos/` y
emite el JSON que consumen los seeders. Existe como script y no como una
conversión hecha una vez porque el stakeholder va a mandar versiones nuevas: se
vuelve a correr y se diffea.

**`tools/bolivia-datasets/load_people.py`** (PR #212, sin correr) — el cargador
del padrón de personas. Lee el markdown en el momento y **no escribe nada a
disco**, así que ninguna cédula entra al repositorio. Usa el alta real de la API,
no `INSERT`: el alta hashea con argon2, crea persona, perfil, identificador y
credencial en una transacción y respeta el registro atómico CTI de la regla 11.

---

## 4 · Lo que hay que aplicar sí o sí

### 4.1 · Los dos patches de esquema

Están en esta misma carpeta. **Sin ellos, en una base reconstruida no se guarda
nada y el registro falla.** Los dos son idempotentes y traen un bloque de
comprobación que rompe si el esquema queda a medias.

**Qué hacer:** moverlos a `SQL/patches/` en tu copia del modelo y borrarlos de
acá, como dice el `README.md` de esta carpeta.

### 4.2 · Los cambios del modelo que sólo existen en mi máquina

`SQL/`, `Mantra Core Health Context/` y `salud-db/` **no son repositorios git**,
así que lo que propagué a las cuatro capas está sólo acá. Tocá estos archivos en
tu copia o pedime el diff:

```
Mantra Core Health Context/modules/
  diagram_02_common.puml      identifiers.issuer_administrative_area_concept_id
                              addresses.municipality_concept_id
  diagram_05_profiles.puml    persons.occupation_concept_id + occupation_free_text
  diagram_08_clinical.puml    conditions: clinical_course, expected_resolution_at,
                                          note_text
                              medication_requests: indication_condition_id,
                                                   patient_instructions_text
  diagram_26_insurance.puml   insurance_carriers.sigla + address

SQL/02_common/{02_tables,04_indexes,90_fk_deferred}.sql
SQL/05_profiles/{02_tables,04_indexes,90_fk_deferred}.sql
SQL/08_clinical/{02_tables,04_indexes,90_fk_deferred}.sql
SQL/26_insurance/02_tables.sql
```

### 4.3 · El front en `dev` no compila

`yarn build` falla con 10 errores, con el árbol limpio y la caché borrada. Todos
en `src/app/features/notifications/notifications.ts`, del Carril 18.

La pantalla llama a cuatro métodos que **su cliente nunca tuvo, en ninguna rama**:

| La pantalla pide | Lo que existe |
|---|---|
| `listChannels()` | — no existe, y **la API tampoco tiene el endpoint** |
| `listMyInApp(50)` | `listMine(…)` |
| `getMyPreferences()` | `readPreferences()` |
| `setPreference(x)` | `updatePreferences(…)` |

El propio commit del carril lo dice: *«merge: traer dev — el cliente de
notificaciones de dev sustituye al del carril»*. Se resolvió el conflicto
quedándose con el cliente de `dev` y la pantalla quedó apuntando al viejo. Otro
commit avisa: *«bloqueado antes del merge, sin verificación Playwright»*.

Es de Pablo y no lo toqué. Tres de los cuatro métodos se mapean directo; el cuarto
no tiene de dónde sacar datos.

> El servidor de desarrollo igual responde en `:4200` —Angular sirve el último
> paquete bueno—, así que la app se navega y sólo se rompe al entrar a
> `/notifications`. Un despliegue real no pasaría.

---

## 5 · Decisiones que son tuyas, no mías

### 5.1 · `uq_insurance_carriers_tenant_id`, y su gemela en `diagnostic_units`

Es lo que obliga a crear un tenant por aseguradora. Es exactamente la misma
discusión que F-15 ya tuvo con `diagnostic_units`, y que resolvió con este
argumento: *«un directorio de laboratorios con una unidad por organización no es
un directorio»*. Si vale allá, vale acá.

Si la restricción cae, los 25 tenants dejan de ser necesarios. El seeder seguiría
funcionando igual —es idempotente y no estorban—, pero se podría simplificar.
**Conviene decidirlo junto con la otra, porque es la misma pregunta.**

### 5.2 · El arancel no tiene tabla destino

Los 4 408 procedimientos entraron como conjunto de valores. Fue una decisión de
rodeo: las tres tablas de precios que existen son otra cosa
(`payments.fee_schedules` son las comisiones de AloVida,
`diagnostic_study_prices` exige el centro concreto que cobra,
`pharmacy_product_prices` son medicamentos).

El arancel del Colegio Médico es un **pliego de referencia**, no la lista de nadie.
Como catálogo funciona, y el día que una clínica cargue *su* precio lo hace
apuntando a estos conceptos. Si querés una tabla propia, es decisión del modelo —
y `check_ddl_sources.py` prohíbe declararla desde el repo de la API, con razón.

### 5.3 · El OCR del arancel

El PDF de honorarios es escaneado y su propia hoja de metadatos lo pide: *«conviene
validar nombres, acentos, códigos y UMA antes de cargar a producción»*. Se le nota:
«Anestesiblogos», «Térax», «cardiol6gico».

**228 de 4 295** filas llevan la propiedad `procedure:review-needed`. Pero ese
detector encuentra sólo lo obvio (letras y dígitos mezclados dentro de una
palabra): **«Térax» por «Tórax» no lo detecta ninguna regla sin un diccionario**,
así que no llevar la marca no certifica nada.

Se cargó igual porque un nomenclador incompleto no sirve para cotizar, y porque el
texto crudo marcado es honesto — inventar la corrección sería peor: un nombre de
procedimiento plausible pero falso no se distingue del bueno.

### 5.4 · El padrón de personas: cargarlo o no, y con qué contraseña

PR **#212** trae el cargador. **No lo corrí**: el entorno bloquea el alta cuando la
contraseña es trivial sobre datos personales, y no me pareció correcto esquivarlo
escribiendo el SQL a mano.

Antes de decidir, el número que importa:

| | Filas en el archivo | Con datos reales |
|---|---|---|
| Pacientes | 165 | **85** |
| Médicos | 170 | **2** |

```
MÉDICOS — 170 filas
   NOMBRE            █···················   13  (7%)
   CEDULA IDENTIDAD  ····················    7  (4%)
   MATRÍCULA         █···················    9  (5%)
   CORREO            ····················    4  (2%)
```

`USUARIO_MEDICOS_1.md` está **al 7 %**: 157 de sus 170 filas están completamente en
blanco. Cargarlo hoy deja la guía de profesionales con dos médicos. **Eso falta en
el origen**: hay que pedirle el padrón completo a quien lo armó.

### 5.5 · `provider-networks.dataset.json` está commiteado

Entró con el PR #209 y contiene **961 médicos reales** de las redes de Alianza y
Nacional Seguros: nombre, especialidad, dirección de consultorio y teléfono.

En la base **no están** — sólo en el repositorio, como dataset. Es dato profesional
que las aseguradoras publican para que los pacientes encuentren a sus médicos, y el
repo es privado, así que me pareció defendible. Pero es una decisión tuya: si
querés que salga, es un commit.

---

## 6 · Huecos que el trabajo destapó

### 6.1 · `VS_BO_OCCUPATION` no existe, y no está en los markdown

El registro de procesos pide las **896 ocupaciones del SEGIP** con búsqueda por
lupa, y lo pide **cuatro veces** (PACIENTE §1.4 y §2.4; MEDICO §1.4 y §5.7). El
front ya la referencia y el ORM ya tiene la columna — pero el catálogo no está en
ninguno de los diez archivos.

**No bloquea nada** mientras tanto: `occupation_free_text` funciona y es la
«entrada libre al final» que el propio registro pide.

### 6.2 · La sigla de Pando

`bo-geography.catalog.ts` declara **`PD`**; el listado del stakeholder dice **`PA`**.
`PD` es la sigla estándar de la cédula boliviana. **No lo cambié** — es una pregunta
para quien armó el listado, no una corrección obvia.

### 6.3 · Especialidades: el catálogo tiene 36, en el mercado hay 148

`VS_MEDICAL_SPECIALTY` lo siembra el paquete del modelo, fuera de git. Ampliarlo
desde la API dejaría **dos dueños del mismo conjunto** — el problema que ya
documentó el módulo 64.

El contraste está en `2026-08-22_datos-bolivia.md`, sección D. **Ojo al leerlo:**
varias son la misma cosa con otro nombre. «Ortopedia y Traumatología» y
«Traumatología y Ortopedia» son una sola, y ésta última ya está. Es material para
curar a mano, no una lista de altas.

### 6.4 · La copia del modelo de esta máquina está atrasada respecto a F-15

`yarn test` deja **3 pruebas en rojo** en `diagnostic_units.indexes.spec.ts`. **No
son de este trabajo.** El spec exige la compuesta `(tenant_id, code)`, y el `.puml`,
`SQL/` y la bóveda de acá siguen con las dos UK viejas.

No lo corregí a propósito: la corrección ya existe en otra máquina, y rehacerla a
ciegas arriesga que las dos copias diverjan. **Confirmá que tu copia la trae**; con
eso, `yarn orm:catalog` deja las tres en verde.

### 6.5 · El front pide `VS_ADMINISTRATIVE_AREA` en nueve sitios

Tu PR #203 resolvió el nombre a favor de `issuer_*` / `VS_BO_DEPARTMENT`, y el patch
de v4.1.4 materializa el nombre ganador. Pero el front todavía referencia
`VS_ADMINISTRATIVE_AREA`, que no existe: esos nueve desplegables no se llenan.

### 6.6 · «Fixture template» está en el catálogo de fichas

Aparece en el selector de plantillas del expediente, entre las 44 reales. Es un
resto de pruebas que se coló al catálogo. Conviene sacarlo antes de mostrarle el
producto a alguien.

---

## 7 · Cómo verificar que todo sigue en pie

Los PRs y su estado:

| PR | Qué | Estado |
|---|---|---|
| **#204** | Las 5 columnas de v4.1.3 | mergeado |
| **#207** | Cuentas de farmacia, laboratorio, imagen y aseguradora | mergeado |
| **#209** | El 500 del registro · 4 408 aranceles · 503 establecimientos · 25 aseguradoras · 88 estudios · 8 formas societarias | mergeado |
| **#210** | Los ejes de la nota clínica · diagnósticos de 12 a 142 | mergeado |
| **#208** (front) | La hoja en blanco | mergeado |
| **#212** | El cargador del padrón | **abierto, sin correr** |

Estado de los catálogos, medido por HTTP contra la base viva:

```
diagnósticos        142        establecimientos     503
medicamentos         62        aseguradoras          25
estudios             88        procedimientos     4 408
plantillas de ficha  44        formas societarias     8
```

Comandos:

```bash
# Reconstruir los datasets cuando el stakeholder mande versiones nuevas
python tools/bolivia-datasets/extract_datasets.py

# Simular la carga del padrón (no da de alta a nadie)
python tools/bolivia-datasets/load_people.py

# Comprobar que no reapareció una segunda fuente de DDL
python salud-db/check_ddl_sources.py
```

Al arrancar la API, el seed informa **16 pasos**; si alguno falla lo dice por
nombre. Con la base al día, `inserted` es cero.

El detalle largo de la parte de datos está en `2026-08-22_datos-bolivia.md`, en
esta misma carpeta.
