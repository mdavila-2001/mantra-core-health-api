-- Consultas de integridad de la carga de síntomas/fenotipos en la base DESECHABLE.
\pset pager off
\echo '== 1. conceptos por code system y versión'
SELECT cs.internal_code, v.version, count(*) AS conceptos
  FROM terminology.catalog_concepts c
  JOIN terminology.code_system_versions v ON v.id = c.code_system_version_id
  JOIN terminology.code_systems cs ON cs.id = v.code_system_id
 WHERE cs.internal_code IN ('hpo','symp','ncit','mesh-c23')
 GROUP BY 1,2 ORDER BY 1;

\echo '== 2. duplicados por (code system version, code) en los 4 sistemas: debe dar 0 filas'
SELECT v.id, c.code, count(*) FROM terminology.catalog_concepts c
  JOIN terminology.code_system_versions v ON v.id = c.code_system_version_id
  JOIN terminology.code_systems cs ON cs.id = v.code_system_id
 WHERE cs.internal_code IN ('hpo','symp','ncit','mesh-c23')
 GROUP BY 1,2 HAVING count(*) > 1;

\echo '== 3. conceptos sin designación preferida: debe dar 0 filas por sistema'
SELECT cs.internal_code, count(*) AS sin_preferida
  FROM terminology.catalog_concepts c
  JOIN terminology.code_system_versions v ON v.id = c.code_system_version_id
  JOIN terminology.code_systems cs ON cs.id = v.code_system_id
 WHERE cs.internal_code IN ('hpo','symp','ncit','mesh-c23')
   AND NOT EXISTS (SELECT 1 FROM terminology.concept_designations d WHERE d.concept_id = c.id AND d.preferred)
 GROUP BY 1;

\echo '== 4. procedencia: conceptos sin source_license / source_version / source_url (debe dar 0)'
SELECT cs.internal_code,
       count(*) FILTER (WHERE NOT EXISTS (SELECT 1 FROM terminology.concept_properties p WHERE p.concept_id = c.id AND p.property_code = 'source_license')) AS sin_licencia,
       count(*) FILTER (WHERE NOT EXISTS (SELECT 1 FROM terminology.concept_properties p WHERE p.concept_id = c.id AND p.property_code = 'source_version')) AS sin_version,
       count(*) FILTER (WHERE NOT EXISTS (SELECT 1 FROM terminology.concept_properties p WHERE p.concept_id = c.id AND p.property_code = 'source_url')) AS sin_url
  FROM terminology.catalog_concepts c
  JOIN terminology.code_system_versions v ON v.id = c.code_system_version_id
  JOIN terminology.code_systems cs ON cs.id = v.code_system_id
 WHERE cs.internal_code IN ('hpo','symp','ncit','mesh-c23')
 GROUP BY 1 ORDER BY 1;

\echo '== 5. is-a: huérfanos (origen o destino inexistente) y autorreferencias: debe dar 0'
SELECT count(*) FILTER (WHERE s.id IS NULL OR t.id IS NULL) AS huerfanas, count(*) FILTER (WHERE r.source_concept_id = r.target_concept_id) AS autorref
  FROM terminology.concept_relationships r
  LEFT JOIN terminology.catalog_concepts s ON s.id = r.source_concept_id
  LEFT JOIN terminology.catalog_concepts t ON t.id = r.target_concept_id;

\echo '== 6. aristas enfermedad → síntoma por tipo'
SELECT t.display AS tipo, count(*) AS aristas
  FROM terminology.concept_relationships r
  JOIN terminology.catalog_concepts t ON t.id = r.relationship_type_concept_id
 WHERE t.code IN ('terminology:relationship:symptom','terminology:relationship:symptom-excluded')
 GROUP BY 1 ORDER BY 1;

\echo '== 7. duplicados de la clave natural de la arista (source,target,tipo): debe dar 0 filas'
SELECT source_concept_id, target_concept_id, relationship_type_concept_id, count(*)
  FROM terminology.concept_relationships GROUP BY 1,2,3 HAVING count(*) > 1;

\echo '== 8. evidencia: huérfanos (arista, fuente, versión, nivel inexistentes): debe dar 0'
SELECT count(*) FILTER (WHERE r.id IS NULL) AS sin_arista,
       count(*) FILTER (WHERE s.id IS NULL) AS sin_fuente,
       count(*) FILTER (WHERE v.id IS NULL) AS sin_version,
       count(*) FILTER (WHERE tr.id IS NULL) AS sin_nivel
  FROM terminology.concept_relationship_evidence e
  LEFT JOIN terminology.concept_relationships r ON r.id = e.concept_relationship_id
  LEFT JOIN terminology.terminology_sources s ON s.id = e.terminology_source_id
  LEFT JOIN terminology.code_system_versions v ON v.id = e.code_system_version_id
  LEFT JOIN terminology.catalog_concepts tr ON tr.id = e.evidence_tier_concept_id;

\echo '== 9. aristas sin ninguna evidencia: debe dar 0 entre las de síntomas'
SELECT count(*) AS aristas_sin_evidencia
  FROM terminology.concept_relationships r
  JOIN terminology.catalog_concepts t ON t.id = r.relationship_type_concept_id
 WHERE t.code IN ('terminology:relationship:symptom','terminology:relationship:symptom-excluded')
   AND NOT EXISTS (SELECT 1 FROM terminology.concept_relationship_evidence e WHERE e.concept_relationship_id = r.id);

\echo '== 10. duplicados de la clave natural de la evidencia: debe dar 0 filas'
SELECT concept_relationship_id, terminology_source_id, source_reference, count(*)
  FROM terminology.concept_relationship_evidence GROUP BY 1,2,3 HAVING count(*) > 1;

\echo '== 11. nulos indebidos en la evidencia (debe dar 0 en todo)'
SELECT count(*) FILTER (WHERE source_reference IS NULL OR source_reference = '') AS sin_referencia,
       count(*) FILTER (WHERE citation_text IS NULL OR citation_text = '') AS sin_cita,
       count(*) FILTER (WHERE citation_locator IS NULL) AS sin_locator,
       count(*) FILTER (WHERE valid_from IS NULL) AS sin_vigencia,
       count(*) FILTER (WHERE (frequency_numerator IS NULL) <> (frequency_denominator IS NULL)) AS ratio_incompleta,
       count(*) FILTER (WHERE frequency_numerator > frequency_denominator) AS ratio_invertida
  FROM terminology.concept_relationship_evidence;

\echo '== 12. evidencia por fuente y nivel'
SELECT s.code AS fuente, t.display AS nivel, count(*) AS filas
  FROM terminology.concept_relationship_evidence e
  JOIN terminology.terminology_sources s ON s.id = e.terminology_source_id
  JOIN terminology.catalog_concepts t ON t.id = e.evidence_tier_concept_id
 GROUP BY 1,2 ORDER BY 1,2;

\echo '== 13. evidencia con frecuencia (clase del value set) y con n/m'
SELECT coalesce(f.display, '(sin clase)') AS frecuencia, count(*) AS filas
  FROM terminology.concept_relationship_evidence e
  LEFT JOIN terminology.catalog_concepts f ON f.id = e.frequency_concept_id
 GROUP BY 1 ORDER BY 2 DESC;
SELECT count(*) AS con_n_sobre_m, min(frequency_denominator) AS min_m, max(frequency_denominator) AS max_m FROM terminology.concept_relationship_evidence WHERE frequency_numerator IS NOT NULL;

\echo '== 14. caso Marfan: «Arachnodactyly» (HP:0001166) desde OMIM:154700 (HPOA) y desde ORPHA:558 (HPOA + Orphadata); cada código cuelga de SU concepto de enfermedad'
SELECT d.code AS enfermedad, e.source_reference, s.code AS fuente, t.display AS nivel, f.display AS frecuencia, e.frequency_numerator AS n, e.frequency_denominator AS m, e.valid_from, left(e.citation_text, 110) AS cita
  FROM terminology.concept_relationship_evidence e
  JOIN terminology.concept_relationships r ON r.id = e.concept_relationship_id
  JOIN terminology.catalog_concepts d ON d.id = r.source_concept_id
  JOIN terminology.catalog_concepts p ON p.id = r.target_concept_id
  JOIN terminology.terminology_sources s ON s.id = e.terminology_source_id
  JOIN terminology.catalog_concepts t ON t.id = e.evidence_tier_concept_id
  LEFT JOIN terminology.catalog_concepts f ON f.id = e.frequency_concept_id
 WHERE d.code IN ('154700','558') AND p.code = 'HP:0001166'
 ORDER BY d.code, s.code, e.source_reference;

\echo '== 15. marca de criterio diagnóstico / patognomónico de Orphanet cargada en la cita'
SELECT count(*) FILTER (WHERE citation_text LIKE '%DiagnosticCriteria=Diagnostic criterion%') AS criterio_diagnostico,
       count(*) FILTER (WHERE citation_text LIKE '%DiagnosticCriteria=Pathognomonic sign%') AS patognomonico
  FROM terminology.concept_relationship_evidence e JOIN terminology.terminology_sources s ON s.id = e.terminology_source_id WHERE s.code = 'INSERM_ORPHANET';

\echo '== 16. cruce Wikidata P3841 y mapas'
SELECT count(*) AS hpo_con_items_wikidata FROM terminology.concept_properties WHERE property_code = 'wikidata_items';
SELECT count(*) AS mapas_hpo_a_glosario FROM terminology.concept_maps m JOIN terminology.catalog_concepts c ON c.id = m.target_concept_id JOIN terminology.code_system_versions v ON v.id = c.code_system_version_id JOIN terminology.code_systems cs ON cs.id = v.code_system_id WHERE cs.internal_code = 'wikidata-sintoma';

\echo '== 17. tamaño de la base'
SELECT pg_size_pretty(pg_database_size(current_database())) AS tamano;
