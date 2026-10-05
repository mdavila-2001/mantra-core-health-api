# Plan ejecutable: ampliar el glosario clínico y su mapa de relaciones

Fecha de corte: 2026-10-05. Estado: piloto de extracción local hecho; endpoint API y vista de red implementados en PRs; expansión anatómica inicial y tipado explícito de síntomas en curso.

## Objetivo

Ampliar el catálogo curado del glosario con definiciones comprensibles, relaciones clínicas trazables y terminología anatómica más profunda. El catálogo final debe distinguir conceptos aprobados de candidatos importados, conservar la fuente y fecha de cada dato, y permitir corregir o retirar un término sin perder su historial.

No existe una lista finita de “todos los sitios médicos existentes”. La cobertura se implementará por fuentes priorizadas y dominios definidos: primero vocabularios y enciclopedias sanitarias públicas con cobertura bilingüe; después organismos nacionales e internacionales para validar lagunas. No se hará una descarga indiscriminada de sitios ni se publicará automáticamente texto ajeno como definición propia.

## Estado y línea base local

- Línea base auditada antes de esta entrega: 69 términos, 12 categorías y 104 relaciones tipadas. Esta entrega añade cinco términos (cuatro estructuras anatómicas y el procedimiento de control de signos vitales) y cinco relaciones; el destino previamente huérfano ahora resuelve. El catálogo resultante queda en 74 términos y 109 relaciones tipadas.
- Se descargó y procesó la distribución comprimida de temas de salud de MedlinePlus del 2026-10-03. Resultado: 2.033 temas bilingües, 6.104 referencias a temas relacionados y 3.165 referencias cruzadas; cinco temas carecen de resumen.
- La extracción encontró 17 candidatos de nombre exacto para revisión frente al catálogo curado. Son candidatos, no equivalencias aprobadas.
- Archivos de ejecución: `2026-10-05/medlineplus-manifest.json`, `medlineplus-topics.jsonl`, `medlineplus-review-queue.csv`, `medlineplus-glossary-coverage.json` y `curated-glossary-profile.json`.
- La interfaz incluye un enlace a la vista de red (PR #959, fusionado); el backend expone nodos y aristas tipadas (PR #571, abierto en la fecha de esta actualización).

## Fuentes por ola

### Ola 1: piloto reproducible

1. **MedlinePlus Health Topics**: nombres ES/EN, resumen, sinónimos y vínculos relacionados. Fuente de descubrimiento y candidatos de enriquecimiento, no de prescripción.
2. **NLM MeSH**: identificadores, términos preferidos, sinónimos y jerarquías para normalizar conceptos cuando el registro/licencia lo permita.
3. **NCI Thesaurus**: conceptos de cáncer, sinónimos y relaciones oncológicas donde la licencia y el formato permitan reutilización.

### Ola 2: cobertura institucional

- **OMS/ICD** para clasificación diagnóstica y denominaciones; no tratar códigos de clasificación como definiciones completas.
- **CDC** para enfermedades transmisibles, prevención y vigilancia, con fecha y jurisdicción visibles.
- **NHS** y **Mayo Clinic** como referencias editoriales secundarias para detectar lagunas y revisar legibilidad; no copiar prosa ni convertir recomendaciones locales en universales.
- **NLM RxNorm** para medicamentos y sinónimos, enlazando conceptos; nunca inferir dosis o tratamientos indicados a partir de relaciones de vocabulario.
- **LOINC** para pruebas y observaciones; mantener el código y contexto técnico, no resumirlo como enfermedad.
- **SNOMED CT** sólo si se confirma licencia, jurisdicción y autorización de redistribución. No incluir distribución internacional restringida por asumir que el acceso web equivale a licencia abierta.

Antes de activar cada fuente se guardan: organismo editor, URL del dataset/API, versión/fecha, términos de uso/licencia, atribución exigida, reglas de robots/API, campos permitidos, frecuencia máxima y responsable de revisión. Se prefieren APIs y descargas oficiales sobre scraping HTML. Las fuentes sin permiso claro quedan en lista de evaluación y no se incorporan al seed.

## Flujo de adquisición y curación

1. **Inventario de cobertura**: comparar las categorías existentes (anatomía, signos/síntomas, enfermedades, pruebas, procedimientos, tratamientos, fármacos, laboratorio, imágenes, cuidados y especialidades) contra cada fuente y priorizar los vacíos de atención primaria y anatomía humana.
2. **Adquisición respetuosa**: usar dump/API oficial; identificar el cliente con agente de usuario y contacto del proyecto cuando la fuente lo permita; limitar concurrencia y velocidad; cachear respuestas; respetar `Retry-After`, robots y condiciones de uso; guardar hash y respuesta original sólo cuando la licencia lo autorice.
3. **Normalización sin pérdida**: producir registros intermedios con `source`, `source_record_id`, `source_url`, `source_version`, `retrieved_at`, `language`, `preferred_label`, `synonyms`, `definition/summary`, `relation`, `source_license` y `raw_hash`. Conservar caracteres, acentos, unidades, negación y texto en idioma original.
4. **Emparejamiento**: exacto normalizado por idioma primero; después sinónimos e identificadores; similitud textual sólo genera candidatos. No unir registros por similitud de nombre sin revisión. Un candidato ambiguo o con discrepancia clínica queda en cola.
5. **Curación editorial**: separar definición clínica, resumen llano, sinónimos, código y relaciones. Redactar texto propio breve; atribuir la fuente y marcar la versión. Un revisor clínico valida precisión, población/edad, contexto, límites y relaciones antes de `active`.
6. **Carga a seed**: convertir únicamente aprobados a `glossary-terms.catalog.ts` (o al formato de seed versionado que lo reemplace); mantener slugs estables; resolver cada destino de relación; el proceso informa altas, cambios, retiradas, conflictos y destinos faltantes antes de tocar la base.
7. **Publicación**: ejecutar seed en entorno local/QA con revisión del diff; comprobar lecturas del glosario y mapa; publicar después de aprobación editorial. Ningún scraping modifica producción directamente.
8. **Mantenimiento**: comparar nueva versión con la anterior, abrir revisión sólo para registros añadidos/cambiados/retirados y conservar una traza de cambios. La caducidad se decide por tipo de dato (más corta para manejo/tratamiento, más larga para anatomía básica).

## Contrato mínimo por término

- Identidad estable: `slug`, identificador de fuente/código cuando exista, nombre preferido ES y EN y sinónimos por idioma.
- Definición clínica: qué es, sistema/estructura implicada, mecanismo o función esencial, criterios que realmente forman parte de la definición y distinciones con términos cercanos. Evitar convertir factores de riesgo o síntomas frecuentes en requisitos diagnósticos.
- Resumen llano: una o dos frases sin jerga; no diagnosticar al lector ni sugerir automedicación.
- Contexto editorial: fuente/URL, versión, idioma, licencia, fecha de revisión, estado editorial y revisor.
- Relaciones dirigidas y tipadas: enfermedad–síntoma, enfermedad–prueba, enfermedad–tratamiento, estructura anatómica, complicación, causa y término relacionado. Registrar dirección y evidencia. Una asociación no significa causalidad ni indicación terapéutica.

## Modelo de relaciones para el mapa

La interfaz inicial lee las relaciones existentes del catálogo y muestra vecinos directos, dirección y categoría. El vocabulario ya incluye `SYMPTOM`; esta entrega tipa explícitamente las relaciones salientes de asma, neumonía e insuficiencia cardiaca hacia síntomas existentes. Las relaciones inversas `DISEASE` desde el síntoma se conservan donde estaban. Las aristas representan asociaciones del catálogo, no causalidad ni consejo clínico.

La red global se paginará o filtrará por categoría cuando el catálogo crezca. El primer corte limita la respuesta, expone `possiblyTruncated` y deja seleccionar un término central. Las aristas deben tener etiqueta textual accesible además de color, navegación a fichas y un aviso fijo: son asociaciones catalogadas y no recomendaciones médicas.

## Profundización anatómica

Priorizar por sistema y dependencia entre estructuras: cardiovascular; respiratorio; digestivo; renal/urinario; nervioso; musculoesquelético; endocrino; tegumentario; hematológico e inmunitario. Cada término debe indicar localización, componentes principales, función, conexiones anatómicas relevantes y diferencias con términos que suelen confundirse. Añadir primero las estructuras que habiliten relaciones con enfermedades, síntomas y pruebas ya presentes. El atlas visual es un índice de placas y no sustituye una definición clínica estructurada.

Primera pasada del catálogo actual: revisar corazón, pulmón, hígado, riñón, encéfalo y columna vertebral. Esta entrega añade páncreas, estómago, piel y médula espinal con definiciones originales y referencias editoriales NCBI Bookshelf. La siguiente ronda anatómica sigue con intestino, vasos sanguíneos y huesos; cerebro/cerebelo/tronco encefálico sólo se separan si el modelo aclara que no son duplicados de `encéfalo`.

## Validaciones de cada lote

- Unicidad de slug e identificador externo; enlaces de sinónimos sin colisiones peligrosas.
- Definición clínica y resumen presentes en ES; traducción EN sólo declarada como traducida después de revisión.
- Toda relación resuelve a un concepto activo; cada relación tiene tipo, dirección y fuente/evidencia.
- Diferencias entre fuente previa/nueva: no cambiar silenciosamente etiqueta, unidad, criterio, fármaco, población o estado.
- Detección de duplicados, términos retirados, relaciones huérfanas, contenido potencialmente prescriptivo y fragmentos demasiado parecidos al original.
- Informe visible por lote: total procesado, rechazado, duplicado, candidato, aprobado, conflicto, huérfano y licencia pendiente.

## Entregas y criterio de salida

1. **P0, implementado en PRs**: grafo API/UI, lectura desde mock y enlace en glosario; compilación completada para la UI y rama de origen API.
2. **P1**: cerrar el piloto MedlinePlus con revisión de los 17 candidatos y hoja de discrepancias; añadir trazabilidad de procedencia al esquema/seed.
3. **P2**: expandir definiciones anatómicas y vocabulario por sistema, empezando por conceptos conectados al catálogo actual.
4. **P3**: añadir fuentes una por una después de revisar licencia y formato; importar candidatos por lote con control editorial. MedlinePlus XML y las otras capas españolas ya tienen importadores en `tools/terminology-import/`.
5. **P4, primera parte implementada**: tipar explícitamente algunas aristas enfermedad→síntoma; ampliar cobertura tras revisión clínica y escalar mapa a navegación filtrada/paginada según tamaño.

La primera liberación de contenido se acepta cuando cada término nuevo tiene fuente reutilizable, definición ES revisada, sinónimos depurados, relaciones no huérfanas y estado editorial explícito; el conteo de términos por sí solo no es criterio de calidad.
