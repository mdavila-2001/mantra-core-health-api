# Plan — auditoría reproducible del lote MedlinePlus P1

- Fecha: 2026-10-05 · Repositorio: `alovida-glossary-pr-api` · Rama base: `origin/dev`
- Resultado observable: un informe auditable distingue integridad de insumos y trazabilidad técnica de las decisiones que todavía requieren revisión clínica/editorial.
- Kill-test: el control no detecta una fila duplicada o una pareja ES/EN enlazada por la fuente que no está representada en la cola.

## Alcance

- IN: revisar el manifiesto, el perfil curado de línea base, las 79 filas de cola y los 2.033 registros del JSONL del 2026-10-05; comprobar duplicados, cobertura de IDs, correspondencia ID/URL/idioma/nombre, versiones, atribución y límites de derechos; documentar discrepancias y gates abiertos; añadir un control de calidad reproducible.
- OUT: editar o borrar la evidencia original bajo `research/medical-terminology`; decidir equivalencia clínica, redactar definiciones, aprobar contenido para publicación o modificar el seed.
- Ambigüedades registradas: el perfil de investigación refleja un catálogo anterior (64 términos); el seed evolucionó en otra rama. El informe trata el perfil como instantánea de entrada y no lo declara igual al catálogo de la rama auditada.

## H1 — Auditoría de procedencia y cola de candidatos
**CA:** Dada la extracción y el perfil archivados, cuando se ejecuta el control, entonces sus conteos, duplicados y discrepancias son reproducibles y las coincidencias clínicas permanecen explícitamente pendientes de revisión humana.
**DoD:** ejecutar `python docs/trabajo/2026-10-05-auditoria-medlineplus-p1/check_medlineplus_audit.py --research-dir ..\research\medical-terminology\2026-10-05` desde este repositorio; salida de resumen determinista, código 0 para insumos estructuralmente completos y códigos distintos si faltan insumos o hay inconsistencias bloqueantes.
**Estado:** HECHO

### H1.S1 — Registrar el plan
**CA:** El alcance, límites y criterio de cierre quedan versionados antes de producir el informe. **DoD:** `git diff --check` sin salida. **Estado:** HECHO

### H1.S2 — Implementar control reproducible de insumos y referencias
**CA:** El control cuenta el lote, detecta duplicados y contrasta cada ID candidato con el JSONL y los enlaces lingüísticos. **DoD:** ejecutar el comando de H1 y registrar el resultado literal en el reporte. **Estado:** HECHO

### H1.S3 — Documentar discrepancias y gates clínicos/editoriales
**CA:** El informe enumera los defectos verificables, separa referencias contextuales de equivalencias y conserva abierta toda decisión clínica/editorial. **DoD:** revisar el reporte contra las salidas del control y `git diff --check`. **Estado:** HECHO

## Riesgos y bloqueos previstos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| El archivo de investigación se conserva fuera del repositorio de API | El control no puede ejecutarse en CI con este checkout aislado | Aceptar ruta externa explícita y no copiar los archivos fuente al PR. |
| Una pareja bilingüe o un término parecido puede parecer equivalencia semántica | Una decisión técnica podría publicarse como juicio clínico | Etiquetar como revisión pendiente y prohibir aprobación automática en el control. |
