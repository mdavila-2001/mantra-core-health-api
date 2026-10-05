# Revisión de candidatos MedlinePlus

Fecha: 2026-10-05. Dataset revisado: Health Topic XML publicado el 2026-10-03 y extraído el 2026-10-05. Esta revisión decide correspondencia de conceptos; no aprueba ni copia definiciones clínicas de MedlinePlus.

## Decisiones

| Slug | Registros | Decisión | Motivo |
|---|---|---|---|
| `disnea` | ES 3078 | `related_context` | «Problemas respiratorios» agrupa causas y síntomas; Disnea figura como término alternativo, pero la página no es equivalente al concepto específico. |
| `fiebre` | ES 1902; EN 511 | `concept_match` | Denominaciones preferidas exactas en ambos idiomas y el propio XML declara el par lingüístico. |
| `cefalea` | ES 1933; EN 273 | `concept_match` | «Cefalea» es denominación alternativa de «Dolor de cabeza»; el tema inglés es «Headache». |
| `ictericia` | ES 4453; EN 4452 | `concept_match` | Tema español exacto y tema inglés «Jaundice» enlazados como equivalentes. |
| `edema` | ES 1879; EN 1229 | `concept_match` | Denominaciones exactas y par lingüístico del XML. |
| `hipertension-arterial` | ES 1955; EN 34 | `concept_match` | «Hipertensión» aparece como término alternativo de «Presión arterial alta» y «Hypertension» de «High Blood Pressure»; ambos registros están enlazados como par lingüístico. |
| `neumonia` | ES 2094; EN 363 | `concept_match` | Denominaciones exactas y par lingüístico del XML. |
| `insuficiencia-cardiaca` | ES 1943; EN 199 | `concept_match` | «Insuficiencia cardíaca» es término alternativo de «Fallo cardíaco»; tema inglés «Heart Failure». |
| `enfermedad-renal-cronica` | ES 5988; EN 5987 | `concept_match` | Denominaciones exactas y par lingüístico del XML. |
| `hemograma-completo` | ES 6352; EN 6351 | `related_context` | La página «Análisis de sangre / Blood Count Tests» cubre una familia de pruebas; que incluya «Hemograma completo / Complete Blood Count» como término alternativo no demuestra equivalencia de todo el tema. |
| `biopsia` | ES 5922; EN 5921 | `concept_match` | Denominaciones exactas y par lingüístico del XML. |
| `dialisis` | ES 3790; EN 3789 | `concept_match` | Tema general de diálisis y par lingüístico. Los tipos específicos se mantienen como términos alternativos de la fuente, no como conceptos añadidos. |
| `quimioterapia` | ES 1795 | `related_context` | El registro es «Quimioterapia para el cáncer», un contexto más estrecho que el concepto general del glosario. |
| `oxigenoterapia` | ES 5335; EN 5334 | `concept_match` | «Oxigenoterapia» es término alternativo de «Terapia con oxígeno»; tema inglés «Oxygen Therapy». |
| `tomografia-computarizada` | ES 3952 | `concept_match` | Denominación española exacta del tema. |
| `mamografia` | ES 2021; EN 1263 | `concept_match` | Denominaciones exactas y par lingüístico del XML. |
| `signos-vitales` | ES 6289; EN 6288 | `concept_match` | Se refiere a los parámetros fisiológicos. El procedimiento de medirlos sigue separado en `control-de-signos-vitales`. |

Resultado: 14 correspondencias de concepto confirmadas y 3 referencias contextuales que no se usan para fusionar conceptos. No se importaron resúmenes. Se guardan ID, idioma, URL, versión, fecha de extracción, atribución y decisión en `concept_properties.glossary-sources` para los términos aceptados o relacionados.

## Derechos y tratamiento

El XML oficial se publica para descarga y reutilización. NLM indica que los resúmenes de Health Topics están en dominio público y pide atribución; también advierte que otros elementos pueden tener derechos separados. Esta carga conserva identificadores, rótulos y enlaces, y no reproduce los resúmenes ni imágenes. Atribución: «Source: MedlinePlus, National Library of Medicine.»

Fuentes oficiales: [MedlinePlus XML](https://medlineplus.gov/xml.html), [uso y derechos de contenido](https://medlineplus.gov/about/using/usingcontent/).
