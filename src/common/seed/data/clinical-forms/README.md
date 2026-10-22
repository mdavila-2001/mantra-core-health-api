# src / common / seed / data / clinical-forms

El **contenido** del catálogo de formularios clínicos estándar: la versión general base de cada
formulario, por especialidad, transcrita a campos y con su ficha de procedencia.

Carril R2-5, punto 5 del reclamo: «NO ESTAN LOS FORMULARIOS: DESCARGAR DE INTERNET LA VERSION
GENERAL BASE DE CADA FORMULARIO ESTANDAR POR ESPECIALIDAD Y DEBE ESTAR CATALOGADO.»

## Cómo está organizado

```text
<especialidad>/<formulario>.json   la definición: ficha de catálogo + esquema de campos
catalog.ts                         el barrel tipado que los importa y los valida
```

`catalog.ts` es la única puerta: importa cada `.json`, estrecha su `dataType` contra los seis
tipos que el motor sabe dibujar y exporta `STANDARD_FORMS`. Un `.json` que no esté importado ahí
no existe para el seed.

**El PDF original no se versiona acá.** Se referencia por URL en `provenance.url` y se guarda
donde el equipo guarde los adjuntos. Un formulario clínico guardado como imagen no es un
formulario: es un adjunto. Lo que sirve —y lo que este directorio contiene— es la transcripción a
campos, que es lo que el motor captura.

## Cobertura (v4.1.6 · 2026-08-21)

**43 formularios**: 4 transversales —que sirven para cualquier consulta— y 39 repartidos entre las
**36 especialidades** de `VS_MEDICAL_SPECIALTY`, que quedan **todas cubiertas**. Antes eran 15
sobre 9 especialidades: a un neurólogo, a un nutricionista o a un radiólogo el selector no le
ofrecía nada suyo.

Tres criterios que se aplicaron al escribir las 28 nuevas y que conviene respetar al agregar más:

- **La base común es la NT 022 del MINSA**, que ya sostenía 8 de las fichas originales: la
  estructura de toda historia clínica (motivo, evolución, examen dirigido, diagnóstico, conducta)
  sale de ahí, y cada ficha declara en su `note` qué ítems son agregado propio de la disciplina.
  No se incorporó ninguna fuente nueva.
- ~~Las escalas van como campo libre.~~ **Reemplazado en la v2 (2026-10-02)**, ver abajo.
- **Emergencia no promete tiempos.** `EMERG_ATENCION_BASE` registra prioridad como texto libre y
  **no** enumera niveles de triage ni compromete tiempos de atención: es una decisión de producto
  que nadie tomó (regla 6 del diagnóstico del documento ecosistémico).

Las tres fichas de **informe** (radiología, patología, laboratorio) respetan igual el molde
—empiezan en `motivo_consulta`, cierran en `diagnostico`— aunque ahí signifiquen «indicación del
estudio» y «conclusión»: el motor y el selector no distinguen tipos de ficha.

## v2 (2026-10-02) — fichas que preguntan lo que corresponde

El propietario revisó la vista previa: 413 de 723 campos eran texto libre, ninguno tenía opciones
y ningún «sí» preguntaba «¿cuál?». La v2 se escribe con **`tools/clinical-forms/build-forms.mjs`**
(`node tools/clinical-forms/build-forms.mjs`, y `--check` para comprobar que los `.json` están al
día). **Los `.json` se editan desde ahí, no a mano.**

- **Secciones SOAP / NT 022**: motivo → antecedentes → hábitos → examen → diagnóstico presuntivo →
  observaciones → plan (`section`).
- **Listas cerradas** (`options`): una respuesta = `string`, varias = `json` + `multiple`. No se
  usa `code`: escribe en `value_concept_id` y estas opciones no son conceptos sembrados.
- **«¿Cuál?» condicional** (`showWhen: { field, equals }`): semántica de FHIR `enableWhen` con
  operador `=` y `SHOW` (la misma de `CreateFieldDependencyDto`). Con padre de varias respuestas
  se cumple si la respuesta incluye el valor; `equals` puede ser una lista. Un campo con el padre
  oculto también se oculta, y `required` sólo vale cuando está a la vista.
- **Diagnóstico presuntivo** con 5 a 8 cuadros frecuentes por especialidad; cada uno abre las
  observaciones que su guía pide (`tools/clinical-forms/sindromes.mjs`): dengue con signos de
  alarma OPS/OMS 2016, neumonía con CURB-65, IC con NYHA y Framingham, EPOC con mMRC, asma con
  GINA, ACV con Cincinnati y Glasgow, diarrea con planes A/B/C, niño con signos de peligro AIEPI,
  tamizaje mental con SRQ-20, alcohol con AUDIT-C (OMS).
- **Un código existente no cambia de tipo** (lo verifica el script): lo que cambia de naturaleza
  entra con código nuevo y la siembra retira el viejo (`visible = false`) sin borrarlo.
- **Dónde se guarda**: la definición del campo no tiene columnas para nada de esto, así que viaja
  en el `default_value_json` de `__catalog__` (`fieldPresentation`), junto a la procedencia, y
  `ChartTemplatesService` lo devuelve en cada campo (`section`, `options`, `multiple`,
  `allowOther`, `description`, `showWhen { fieldId, equals }`).
- **Instrumentos con licencia comercial no confirmada no entran**: además de los de la tabla de
  abajo, se dejaron afuera STOP-BANG, IIEF-5, Braden, Morse, MUST, criterios de Roma y CAM; donde
  hacían falta, la ficha pregunta lo clínico sin el instrumento (lo prueba `catalog.spec.ts`).

## Una ficha base y fichas específicas por especialidad (2026-10-02)

Así trabaja un médico: la **primera consulta** se hace con la ficha base de la especialidad, y los
**controles** de una enfermedad ya diagnosticada, con la ficha estándar de esa enfermedad. Cada
ficha declara su clase en `kind`:

| `kind`     | Qué es                                                                                                                                        | Cuántas                  |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| `BASE`     | La consulta inicial de la especialidad («Cardiología — consulta inicial (ficha base)»)                                                        | 36, una por especialidad |
| `SPECIFIC` | El control o la evaluación estándar de una condición (control de HTA, de asma, de diabetes, dengue, trabajo de parto, informe de mamografía…) | 97                       |
| `GENERAL`  | Las transversales: anamnesis, examen físico, consentimiento, epicrisis                                                                        | 4                        |

- La base pregunta el **diagnóstico presuntivo de una lista**; lo que hay que observar de cada
  cuadro está en su ficha específica.
- Las específicas comparten un armazón (`control()` en `tools/clinical-forms/lib.mjs`), según el
  tipo de ficha:
  - **controles crónicos:** tipo de control, fecha del diagnóstico, tratamiento, adherencia y
    efectos adversos;
  - **cuadros agudos:** inicio y tratamiento previo;
  - **evaluaciones puntuales:** primera vez o control;
  - **informes** (`informeDe()`): indicación, resultado y conclusión.

  Después de esa apertura viene la evaluación propia del cuadro y, al final, metas, educación,
  diagnóstico y plan.

- Las específicas viven en la carpeta de su especialidad como `<codigo-en-kebab>.json`. Se crean
  con el generador, que también escribe `specific-forms.generated.ts`, el barrel que importa
  `catalog.ts`.
- Fuentes de las específicas en `tools/clinical-forms/fuentes.mjs`. Sólo organismos citables
  (OMS/OPS, NIH, NCI, MINSA); de GINA, GOLD, KDIGO, EULAR, AAO y ACR se toman **categorías**, no
  texto.

## Agregar un formulario

1. Crear `<especialidad>/<formulario>.json` con la ficha de procedencia y escribir sus campos en
   `tools/clinical-forms/` (luego correr `build-forms.mjs`).
2. Sumar su `import` a `catalog.ts` y su entrada a `STANDARD_FORMS`.
3. Nada más: `ClinicalFormsSeedService` lo siembra en el próximo arranque, y si la especialidad
   todavía no existe como concepto de terminología, la siembra también.

El `code` es la clave de origen: es lo que hace idempotente al seed y lo que evita que una
plantilla ya editada por la organización se pise. **No se cambia** una vez publicado; un
formulario que cambia de esquema sube `version` y, si el cambio es de fondo, entra con código
nuevo.

## La regla de la procedencia

`provenance` es obligatorio y completo —`sourceTitle`, `organization`, `url`, `license`,
`retrievedAt`— porque **muchos formularios clínicos estándar tienen derechos de autor**. Algunos
son de uso libre y citable; otros son propiedad de sociedades científicas o de editoriales y no se
pueden incorporar a un producto comercial sin licencia, aunque el PDF se baje gratis de la web.

Se priorizaron fuentes de dominio público o con licencia abierta: OPS/OMS, CDC y normas técnicas
de ministerios de salud. Lo que no cumple, no entra.

### Fuentes usadas

| Organismo           | Documento                                                                                                                                                                         | Licencia                              |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| OMS                 | [Patrones de crecimiento infantil](https://www.who.int/es/news-room/questions-and-answers/item/child-growth-standards)                                                            | CC BY-NC-SA 3.0 IGO                   |
| OMS                 | [Oral health surveys: basic methods, 5.ª ed.](https://www.who.int/publications/i/item/9789241548649)                                                                              | CC BY-NC-SA 3.0 IGO                   |
| OPS/OMS             | [Directrices para la evaluación y el manejo del riesgo cardiovascular](https://www.paho.org/sites/default/files/2023-10/directrices-evaluacion-manejo-riesgo-cv-oms.pdf)          | CC BY-NC-SA 3.0 IGO                   |
| OPS/OMS · CLAP/SMR  | [Historia Clínica Perinatal simplificada](https://iris.paho.org/handle/10665.2/17048)                                                                                             | CC BY-NC-SA 3.0 IGO                   |
| MINSA (Perú)        | [NT N.º 022-MINSA/DGSP-V.02, Gestión de la Historia Clínica](https://bvs.minsa.gob.pe/local/dgsp/NT022hist.pdf)                                                                   | Norma técnica estatal, acceso público |
| MinSalud (Colombia) | [Resolución 1995 de 1999](https://www.minsalud.gov.co/normatividad_nuevo/resoluci%C3%93n%201995%20de%201999.pdf)                                                                  | Norma estatal, acceso público         |
| MinSalud (Colombia) | [Modelo de consentimiento informado, Res. 1738](https://www.minsalud.gov.co/sites/rid/Lists/BibliotecaDigital/RIDE/VS/ED/VSP/modelo-consentimiento-informado-resolucion-1738.pdf) | Documento oficial, acceso público     |

## 🟡 Lo que quedó afuera por licencia, y con qué se reemplazaría

**No se omitió nada en silencio.** Estos instrumentos son los que un médico esperaría encontrar y
**no se cargaron** porque son propiedad de un tercero. El cliente decide: consigue la licencia, o
se queda el reemplazo libre.

| Instrumento                                                                 | Titular                | Por qué no entró                                                                                                                                                        | Reemplazo libre propuesto                                                                                                                  |
| --------------------------------------------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| PHQ-9 (Cuestionario de Salud del Paciente)                                  | Pfizer Inc.            | Los PDF que circulan llevan «Copyright © Pfizer Inc.». El permiso de reproducción es amplio pero **no consta por escrito para uso comercial incorporado a un producto** | **SRQ-20** de la OMS, tamizaje de trastornos mentales comunes en atención primaria, publicado por la propia OMS                            |
| GAD-7 (Ansiedad Generalizada)                                               | Pfizer Inc.            | Mismo caso que PHQ-9                                                                                                                                                    | Sección de ansiedad del **SRQ-20**                                                                                                         |
| Inventario de Depresión de Beck (BDI-II)                                    | Pearson / NCS Pearson  | Instrumento comercial con licencia por uso                                                                                                                              | **SRQ-20** de la OMS                                                                                                                       |
| Mini-Mental State Examination (MMSE)                                        | PAR Inc.               | Licenciado por PAR desde 2001; se cobra por formulario                                                                                                                  | **Prueba cognitiva breve de dominio público** a definir con el cliente; no se cargó ninguna por las dudas                                  |
| AUDIT (versión editorial ilustrada)                                         | Ediciones derivadas    | El instrumento base es de la OMS, pero las versiones ilustradas que circulan son ediciones con derechos propios                                                         | **AUDIT publicado por la OMS**, pendiente de fichar la URL oficial antes de cargarlo                                                       |
| Escalas funcionales de traumatología (p. ej. las de sociedades ortopédicas) | Sociedades científicas | Licencia por institución                                                                                                                                                | Se cargó la **evaluación musculoesquelética base** (rango de movilidad, fuerza, estabilidad, estado neurovascular), sin escala con puntaje |
| Escalas de riesgo de sociedades de cardiología                              | Sociedades científicas | Licencia por institución                                                                                                                                                | **Tablas de predicción de riesgo cardiovascular OMS/OPS**, ya cargadas                                                                     |

Ninguno de estos siete se puede cargar «mientras tanto» y sacar después: una vez que el catálogo
sale con material licenciado, sacarlo es un incidente, no un commit.
