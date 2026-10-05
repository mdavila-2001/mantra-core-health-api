# Reporte — auditoría de candidatos MedlinePlus P1

- Fecha: 2026-10-05 · Plan: [PLAN.md](./PLAN.md) · Rama: `codex/medlineplus-p1-audit-20261005` (base `origin/dev`)
- Peldaño de evidencia: `TESTED` para el control de insumos; el contenido clínico no fue aprobado.
- Avance: 3 / 3 microtareas (100 %).

## Completado

| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1.S1.M1 | Plan, alcance y gates registrados antes del informe | `git diff --check` | Sin errores de whitespace |
| H1.S2.M1 | Control reproducible de manifiesto, perfil, CSV y JSONL | `python docs/trabajo/2026-10-05-auditoria-medlineplus-p1/check_medlineplus_audit.py --research-dir ..\research\medical-terminology\2026-10-05` | Código 0; conteos consistentes y advertencias reproducibles abajo |
| H1.S3.M1 | Discrepancias y revisiones humanas pendientes documentadas sin cambiar los insumos | `git diff --check` | Sin errores de whitespace; insumos de investigación intactos |

## Resumen verificable

- Manifiesto y extracción concuerdan: el ZIP indicado existe y su SHA-256 coincide; 2.033 registros, versión del release coincidente, 1.017 en inglés y 1.016 en español; los cinco resúmenes vacíos se distribuyen en tres registros españoles y dos ingleses, tal como declara el manifiesto. El perfil registra 64 términos y 64 slugs únicos; la cola cubre 64 slugs.
- La cola tiene 79 filas, con 32 filas que llevan ID candidato: 17 slugs y 30 registros MedlinePlus únicos. Las 30 filas únicas verifican ID, URL, idioma y rótulo en el campo fuente declarado (`title` o `also_called`); los slugs de esos candidatos se normalizan desde su rótulo curado. Esto comprueba trazabilidad de etiquetas, no identidad clínica.
- La revisión previa del lote en `codex/glossary-expansion-followup-20261005` (commit `dc201a00`, `docs/terminology-expansion/MEDLINEPLUS-REVIEW.md`) clasifica 14 candidatos como `concept_match` y tres como `related_context`. Este informe conserva esa clasificación como estado documentado pendiente de aprobación humana; no la ratifica como equivalencia clínica. No reproduce resúmenes ni definiciones.

## Matriz de los 17 candidatos

`ID (idioma)` identifica registros de la extracción. “Campo” es el campo que generó la coincidencia técnica de la cola. “Estado documentado” resume `MEDLINEPLUS-REVIEW.md`, no constituye aprobación clínica.

| Slug / rótulo curado | ID(s) ES | ID(s) EN | Campo y estado documentado | Decisión clínica/editorial abierta |
|---|---:|---:|---|---|
| `disnea` / Disnea | 3078 | — (3077 enlazado, fuera de cola) | `also_called`; `related_context` | Confirmar que el tema amplio de problemas respiratorios sólo se use como contexto; decidir si enlazar el par EN. |
| `fiebre` / Fiebre | 1902 | 511 | `title`; `concept_match` | Revisor clínico confirma identidad, alcance y pertinencia bilingüe antes de publicación. |
| `cefalea` / Cefalea | 1933 | 273 | ES `also_called`, EN `title`; `concept_match` | Revisor clínico confirma que la etiqueta alternativa ES y el tema EN cubren el concepto del glosario. |
| `ictericia` / Ictericia | 4453 | 4452 | `title`; `concept_match` | Confirmar identidad y equivalencia editorial ES/EN. |
| `edema` / Edema | 1879 | 1229 | `title`; `concept_match` | Confirmar identidad y equivalencia editorial ES/EN; corregir las filas duplicadas de la cola. |
| `hipertension-arterial` / Hipertensión arterial | 1955* | 34 | `also_called`; `concept_match` documentado | Resolver discrepancia: el ID 34 es la única fila de cola; el 1955 se añade en provenance como match, aunque no es un candidato exacto de cola. Revisar el rótulo alternativo fuente “Hipertensión” frente al rótulo curado “Hipertensión arterial”. |
| `neumonia` / Neumonía | 2094 | 363 | `title`; `concept_match` | Confirmar identidad y equivalencia editorial ES/EN. |
| `insuficiencia-cardiaca` / Insuficiencia cardíaca | 1943 | 199 | ES `also_called`, EN `title`; `concept_match` | Confirmar que la etiqueta alternativa ES y el tema EN cubren el mismo concepto. |
| `enfermedad-renal-cronica` / Enfermedad renal crónica | 5988 | 5987 | `title`; `concept_match` | Confirmar identidad y equivalencia editorial ES/EN. |
| `hemograma-completo` / Hemograma completo | 6352 | 6351 | `also_called`; `related_context` | No fusionar automáticamente: revisar la diferencia entre una prueba específica y una página que agrupa pruebas de conteo sanguíneo. |
| `biopsia` / Biopsia | 5922 | 5921 | `title`; `concept_match` | Confirmar identidad y equivalencia editorial ES/EN. |
| `dialisis` / Diálisis | 3790 | 3789 | `title`; `concept_match` | Confirmar alcance del término general frente a tipos de diálisis. |
| `quimioterapia` / Quimioterapia | 1795 | — (464 enlazado, fuera de cola) | `also_called`; `related_context` | Mantener como contexto hasta decidir alcance: el tema ES es para cáncer; decidir si el par EN debe documentarse. |
| `oxigenoterapia` / Oxigenoterapia | 5335 | 5334 | ES `also_called`, EN `title`; `concept_match` | Confirmar que las etiquetas cubren el mismo concepto, sin convertir la referencia en recomendación de tratamiento. |
| `tomografia-computarizada` / Tomografía computarizada | 3952 | — (3951 enlazado, fuera de cola) | ES `title`; `concept_match` documentado | Resolver cobertura lingüística: el registro EN enlazado no está en cola ni en provenance; confirmar alcance antes de publicar. |
| `mamografia` / Mamografía | 2021 | 1263 | `title`; `concept_match` | Confirmar identidad y equivalencia editorial ES/EN; mantener cualquier uso clínico/screening sujeto a revisión actualizada. |
| `signos-vitales` / Signos vitales | 6289 | 6288 | `title`; `concept_match` | Confirmar que el concepto son parámetros fisiológicos y no el procedimiento separado para medirlos. |

\* El ID 1955 está enlazado lingüísticamente desde el ID 34 en el JSONL, pero la cola sólo contiene 34. Se lista para reconciliar cobertura/provenance; no se añade a la decisión de la cola.

## Discrepancias y metadata de fuente

1. **Duplicación:** la cola repite dos veces cada una de las filas `edema/1229` y `edema/1879`. Tras deduplicar quedan 30 IDs, no 32. Los archivos de investigación no se modificaron.
2. **Contrapartes omitidas:** la fuente enlaza los IDs EN 3077 (disnea), 464 (quimioterapia), 3951 (tomografía) y el ID ES 1955 (hipertensión), pero no todos constan como fila candidata; 1955 sí se registra después en el provenance de la rama de expansión. La diferencia entre “par enlazado”, “nombre exacto en cola” y “concepto equivalente” debe quedar explícita.
3. **Completitud de entrada:** 2.033 filas coinciden con el conteo declarado; el archivo de perfil contiene sólo conteos y ruta de catálogo, no inventario de los 64 slugs, por lo que no permite verificar por sí solo pertenencia de cada candidato al catálogo. La cola sí tiene 64 slugs distintos. La normalización de slug se comprobó para las 17 filas agrupadas con candidatos.
4. **Versión y derechos:** el manifiesto conserva archivo, SHA-256, versión/release, fecha de extracción, URL de derechos y atribución (`Source: MedlinePlus, National Library of Medicine`). No incluye campo estructurado `source_license`. NLM permite reutilizar sus XML y pide atribución; los resúmenes de Health Topics son de dominio público, pero otros materiales enlazados pueden estar protegidos. La política del lote de no copiar resúmenes/imágenes es consistente con esa distinción. El enlace oficial también confirma la distribución bilingüe y los elementos de metadatos/idioma/ID presentes en el XML: [XML de MedlinePlus](https://medlineplus.gov/xml.html), [uso y derechos](https://medlineplus.gov/about/using/usingcontent/).
5. **Estado editorial:** las filas de cola dicen `needs_human_concept_review`; los registros de extracción dicen `staged_not_clinically_reviewed`. La cola no debe habilitar una carga o publicación automática.

## Gates abiertos (no bloquean este informe; sí bloquean aprobar/publicar contenido)

- **Clínico:** un revisor clínico autorizado debe decidir equivalencia y límites de los 17 mapeos; confirmar contexto, población, alcance, idioma y diferencias con conceptos cercanos. Especial atención: disnea vs. tema respiratorio general; hemograma específico vs. familia de pruebas; quimioterapia general vs. cáncer; tomografía ES y cobertura EN; e hipertensión ID 1955/rótulo alternativo.
- **Editorial/terminología:** depurar dos filas duplicadas de edema en la cola fuente de trabajo; reconciliar las cuatro contrapartes fuera de cola y la clasificación del ID 1955; confirmar nombres y sinónimos ES/EN con editor bilingüe. El estado de los 14 `concept_match` no equivale a aprobación clínica.
- **Licencias:** añadir evidencia estructurada de licencia/alcance por tipo de activo en el registro de lote y confirmar que la extracción guardada mantiene sólo los elementos autorizados. La licencia de resúmenes no debe interpretarse como licencia general de imágenes, contenido de terceros o demás componentes XML.
- **Publicación:** tras resolver los gates anteriores, exigir definición propia revisada, procedencia y relaciones revisadas antes de activar cualquier concepto; este trabajo no modifica el seed.

## A medias

Ninguna microtarea del alcance quedó a medias. Las decisiones clínicas/editoriales/licencia quedan abiertas como gates externos y se listan arriba; no se presentan como trabajo terminado.

## Pendiente

| ID | Estado | Qué lo destraba |
|---|---|---|
| Contenido clínico de los 17 candidatos | BLOQUEADO para publicación | Revisión y firma de responsable clínico/editorial; no forma parte de este PR de auditoría. |
| Reparación de la cola original | DESCARTADO en este PR | Reprocesar en un nuevo lote preservando este archivo original; deduplicar edema y declarar política para pares enlazados no exactos. |
| Licencia estructurada | TODO para un siguiente lote | Registrar fuente, activo/campo, licencia, atribución y alcance permitido en el manifiesto del siguiente lote. |

## Evidencia

Salida literal del control reproducible:

```text
INPUTS topics=2033/2033 languages={'English': 1017, 'Spanish': 1016} archive_sha256=verified queue_rows=79 queue_slugs=64 profile_terms=64 profile_unique_slugs=64
CANDIDATES rows=32 unique_slugs=17 unique_records=30
REVIEW duplicate candidate queue rows: edema/1229 x2; edema/1879 x2
REVIEW source-linked language counterpart not separately queued: 464, 1955, 3077, 3951
REVIEW manifest has rights_page and attribution but no structured source_license/license field
CLINICAL_DECISIONS none; this check never approves equivalence or publication
```

## No cubierto

- No se verificó exactitud clínica, intención diagnóstica, sinónimos clínicos, traducción médica ni actualización de recomendaciones.
- No se aprobó equivalencia por similitud textual, enlace de traducción, rótulo alternativo o nombre exacto.
- No se volvió a descargar el XML ni se modificó/redistribuyó ninguno de los insumos de investigación.

## Desvíos del plan

- El informe incorpora enlaces oficiales actuales de MedlinePlus para corroborar las declaraciones generales de reutilización, además de los metadatos locales del release archivado.

## Riesgos residuales

- La extracción y el perfil permanecen fuera de este repositorio. Para reproducir el control se debe disponer localmente de la ruta indicada; el PR no incorpora los 6,6 MB de JSONL ni el archivo comprimido.
- Los enlaces oficiales de derechos pueden cambiar; una nueva extracción debe revalidar términos y activo específico antes de reutilizar contenido.

## Decisiones y ambigüedades

- No se modifica la cola aunque haya duplicados; se mantiene la evidencia intacta y se anota el hallazgo.
- `concept_match` en el documento de revisión representa el criterio documentado por el equipo, no una aprobación clínica atribuible a este informe.
