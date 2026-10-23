# Plan ejecutable: ampliar el glosario clínico y su mapa de relaciones

Fecha de corte: 2026-10-05. Estado: entregas del primer corte completadas: API/UI de red, expansión anatómica, revisión de candidatos MedlinePlus, procedencia en seed y registro de licencias. La importación masiva de nuevas nomenclaturas no forma parte de este corte.

## Objetivo

Ampliar el catálogo curado del glosario con definiciones comprensibles, relaciones clínicas trazables y terminología anatómica más profunda. El catálogo final debe distinguir conceptos aprobados de candidatos importados, conservar la fuente y fecha de cada dato, y permitir corregir o retirar un término sin perder su historial.

No existe una lista finita de “todos los sitios médicos existentes”. La cobertura se implementará por fuentes priorizadas y dominios definidos: primero vocabularios y enciclopedias sanitarias públicas con cobertura bilingüe; después organismos nacionales e internacionales para validar lagunas. No se hará una descarga indiscriminada de sitios ni se publicará automáticamente texto ajeno como definición propia.

## Estado y línea base local

- Línea base auditada antes de la expansión anatómica: 69 términos, 12 categorías y 104 relaciones tipadas. La expansión añadió diez estructuras anatómicas y un procedimiento, resolvió el destino previamente huérfano y separó cerebro, cerebelo y tronco encefálico del concepto más amplio `encéfalo`. El catálogo queda en 80 términos y 120 relaciones tipadas.
- Se descargó y procesó la distribución comprimida de temas de salud de MedlinePlus del 2026-10-03. Resultado: 2.033 temas bilingües, 6.104 referencias a temas relacionados y 3.165 referencias cruzadas; cinco temas carecen de resumen.
- La revisión de los 17 candidatos exactos concluyó: 14 corresponden al mismo concepto y 3 sólo aportan contexto relacionado. Ninguno añade una definición copiada ni fusiona conceptos. Decisiones en `MEDLINEPLUS-REVIEW.md`.
- El informe versionado de decisiones está en `MEDLINEPLUS-REVIEW.md`; la descarga completa y sus archivos intermedios no se distribuyen con el repositorio.
- La interfaz incluye el enlace a la vista de red; la rama de trabajo contiene el endpoint de nodos y aristas tipadas y su integración de lectura.
- Referencias editoriales persistidas en `concept_properties.glossary-sources` para anatomía y candidatos revisados, con ID, URL, idioma, versión, fecha, atribución, derechos y tipo de correspondencia. La ficha las presenta en «Fuente y código».

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

La interfaz lee las relaciones existentes del catálogo y muestra vecinos directos, dirección y categoría. El vocabulario ya incluye `SYMPTOM`; las relaciones salientes de asma, neumonía e insuficiencia cardiaca hacia síntomas están tipadas explícitamente. Las relaciones inversas `DISEASE` desde el síntoma se conservan donde estaban. Las aristas representan asociaciones del catálogo, no causalidad ni consejo clínico.

La red devuelve hasta 500 nodos, expone `possiblyTruncated` y deja seleccionar un término central. Las aristas tienen etiqueta textual accesible, navegación a fichas y un aviso de que son asociaciones catalogadas y no recomendaciones médicas. Con 80 nodos el conjunto no se acerca al límite; paginación/filtro quedan como regla condicional de escalado, no como trabajo abierto en este corte.

## Profundización anatómica

Priorizar por sistema y dependencia entre estructuras: cardiovascular; respiratorio; digestivo; renal/urinario; nervioso; musculoesquelético; endocrino; tegumentario; hematológico e inmunitario. Cada término debe indicar localización, componentes principales, función, conexiones anatómicas relevantes y diferencias con términos que suelen confundirse. Añadir primero las estructuras que habiliten relaciones con enfermedades, síntomas y pruebas ya presentes. El atlas visual es un índice de placas y no sustituye una definición clínica estructurada.

Primera pasada anatómica completada: corazón, pulmón, hígado, riñón, encéfalo y columna vertebral revisados; se añadieron páncreas, estómago, piel, médula espinal, intestino, vasos sanguíneos y huesos con definiciones propias y referencias editoriales NCBI Bookshelf. Cerebro, cerebelo y tronco encefálico tienen nodos separados enlazados a `encéfalo`; la ficha de éste ya no presenta «cerebro» como sinónimo, para no duplicar conceptos. Las referencias quedaron persistidas en `glossary-sources` y se muestran en la ficha.

## Validaciones de cada lote

- Unicidad de slug e identificador externo; enlaces de sinónimos sin colisiones peligrosas.
- Definición clínica y resumen presentes en ES; traducción EN sólo declarada como traducida después de revisión.
- Toda relación resuelve a un concepto activo; cada relación tiene tipo, dirección y fuente/evidencia.
- Diferencias entre fuente previa/nueva: no cambiar silenciosamente etiqueta, unidad, criterio, fármaco, población o estado.
- Detección de duplicados, términos retirados, relaciones huérfanas, contenido potencialmente prescriptivo y fragmentos demasiado parecidos al original.
- Informe visible por lote: total procesado, rechazado, duplicado, candidato, aprobado, conflicto, huérfano y licencia pendiente.

## Entregas y criterio de salida

1. **P0, completado**: grafo API/UI, lectura desde mock, ficha y enlace en el glosario.
2. **P1, completado**: los 17 candidatos tienen decisión documentada; 14 referencias equivalentes y 3 contextuales están en el seed; IDs, URLs, idiomas, versión, fecha, atribución y derechos se conservan.
3. **P2, primera cobertura completada**: anatomía priorizada y subdivisiones del encéfalo están relacionadas sin duplicar conceptos.
4. **P3, primera ola completada**: MedlinePlus y NCBI Bookshelf están documentados como referencias; `SOURCE-REGISTER.md` fija las condiciones de reutilización para cada fuente evaluada.
5. **P4, completado para el tamaño actual**: relaciones de síntomas explícitas, red accesible y acotada, selección de término y aviso clínico. El umbral de 500 nodos para activar paginación/filtro aún no se alcanza.

La primera liberación de contenido se acepta cuando cada término nuevo tiene fuente reutilizable, definición ES revisada, sinónimos depurados, relaciones no huérfanas y estado editorial explícito; el conteo de términos por sí solo no es criterio de calidad.
