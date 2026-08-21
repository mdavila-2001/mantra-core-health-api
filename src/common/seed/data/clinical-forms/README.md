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

## Agregar un formulario

1. Crear `<especialidad>/<formulario>.json` con la forma de `StandardFormDefinition`.
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
