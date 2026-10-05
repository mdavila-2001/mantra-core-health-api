# NNAC de Bolivia → fichas clínicas

Fichas generadas a partir de las **Normas Nacionales de Atención Clínica** del Ministerio de Salud y Deportes de Bolivia. Ver `especificas-nnac.mjs` para la lógica y `parse-nnac*.mjs` para la extracción.

## Fuentes

- **2012**: libro completo, unidades 1 a 14 (806 de 1 566 páginas; las unidades 15 a 24 no están en el PDF público disponible). PDF: plataforma de la OMS (ver `provenance.url`).
- **2025** (RM 0456, 30/09/2025): seis volúmenes por especialidad en minsalud.gob.bo: Medicina Interna, Terapia Intensiva, Traumatología, Urgencias y Emergencias, Neurología y Pediatría.

## Cómo se arma

```text
extract-text.mjs  PDF → texto por página (pdfjs-dist, fuera del repo)
parse-nnac.mjs    texto 2012 → nnac-norms.json
parse-nnac2025.mjs texto 2025 → nnac-norms-2025.json
especificas-nnac.mjs  elige edición por enfermedad y arma los campos
build-forms.mjs   escribe los .json y el barrel
```

## Reglas que no se negocian

- Cada opción es una viñeta de la norma. No se redactó ningún ítem clínico. Verificado contra el texto de los PDF: **cada opción aparece literalmente**.
- **El tratamiento no se transcribe a opciones** (dosis, vías, esquemas por nivel): campo de texto que apunta a la página. Un filtro descarta dosis, vías de administración e instrucciones, y una prueba del catálogo lo fija.
- Donde el PDF imprime referencia y alta (o contrarreferencia) en columnas pegadas, la lista es una sola.
- Los criterios diagnósticos descartan instrucciones al médico («Identificar…», «Considerar…»): no son hallazgos.
- **Revisión clínica pendiente**: la extracción es mecánica con filtros. Las listas pueden estar incompletas.

## Una ficha por enfermedad

Para una misma enfermedad hay una sola ficha: la de 2025 sustituye a la de 2012 **salvo que la de 2012 traiga más contenido extraído** (tabla `SUSTITUYE`). Cifras: {"de2012":152,"de2025":79,"retiradas2012":41,"saltadas2025":48}.

### Enfermedades que siguen en la edición 2012 pese a existir capítulo 2025

La edición 2025 es la vigente; en estos casos mi extracción de 2025 trajo menos ítems que la de 2012. Mejorar el extractor de 2025 (tablas y flujogramas) reduciría esta lista.

- **MI** (8): ASMA BRONQUIAL; DISLIPIDEMIAS; ENFERMEDAD POR REFLUJO GASTROESOFÁGICO; ESTREÑIMIENTO CRÓNICO; FIEBRE TIFOIDEA Y PARATIFOIDEA; HIPERTENSIÓN ARTERIAL SISTÉMICA O ESENCIAL; HIPOTIROIDISMO; ÚLCERA PÉPTICA
- **TI** (3): ACCIDENTE CEREBROVASCULAR AGUDO / STROKE ISQUÉMICO; TRAUMA TORÁCICO (SEVERO); TROMBOEMBOLISMO PULMONAR – EMBOLIA PULMONAR
- **TRA** (1): LUMBALGIA
- **URG** (18): CAÍDAS EN EL ADULTO MAYOR; CHOQUE; CRISIS HIPERTENSIVA; ENFERMEDAD TROMBOEMBÓLICA VENOSA PROFUNDA; HEMOPTISIS – EMERGENCIAS Y URGENCIAS RESPIRATORIAS; HERIDAS; INTOXICACIÓN AGUDA POR ACETILSALICÍLICO; INTOXICACIÓN AGUDA POR BENZODIAZEPINAS; INTOXICACIÓN AGUDA POR ETANOL; INTOXICACIÓN AGUDA POR INHIBIDOR DE COLINESTERASA; INTOXICACIÓN AGUDA POR PARAQUAT; INTOXICACIÓN POR PARACETAMOL; INTOXICACIONES AGUDAS; MORDEDURA DE SERPIENTE; MORDEDURA DE VIUDA NEGRA (LATRODECTUS MACTANS, ARÁ; PARO CARDIORRESPIRATORIO – REANIMACIÓN CEREBROCARD; QUEMADURAS; SÍNDROME TROPOIDE (CHÁMICO, FLORIPONDIO, TARHUI)
- **NEU** (5): ATAQUE CEREBROVASCULAR ISQUÉMICO; ENFERMEDADES DESMIELINIZANTES / ESCLEROSIS MÚLTIPL; EPILEPSIA; ESTADO DE MAL EPILÉPTICO (EE); POLINEUROPATÍA INFLAMATORIA
- **PED** (13): ASMA; BRONQUIOLITIS; ERISIPELA; FARINGITIS ESTREPTOCÓCICA; HEPATITIS AGUDA TIPO A; HEPATITIS AGUDA TIPO A COMPLICADA; INFLUENZA; NEUMONÍA ADQUIRIDA EN LA COMUNIDAD NAC; OBESIDAD INFANTIL; OTITIS MEDIA AGUDA; SALMONELOSIS; SARAMPIÓN; TALLA BAJA O RETARDO DE CRECIMIENTO
