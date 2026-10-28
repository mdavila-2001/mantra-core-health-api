-- Integridad de la carga de nutrición y alimentos (psql -d <base desechable> -f verify-load.sql). Todas las consultas de "problemas" deben dar 0.
\pset footer off
\echo '== conteos por fuente y code system =='
SELECT s.code AS fuente, cs.internal_code AS code_system, csv.version, count(cc.id) AS conceptos
  FROM terminology.terminology_sources s
  JOIN terminology.code_systems cs ON cs.source_id = s.id
  JOIN terminology.code_system_versions csv ON csv.code_system_id = cs.id
  LEFT JOIN terminology.catalog_concepts cc ON cc.code_system_version_id = csv.id
 WHERE s.code LIKE 'NUTRITION\_%' GROUP BY 1, 2, 3 ORDER BY 1, 2;
\echo '== totales de esta carga =='
WITH mine AS (
  SELECT cc.id FROM terminology.catalog_concepts cc
    JOIN terminology.code_system_versions csv ON csv.id = cc.code_system_version_id
    JOIN terminology.code_systems cs ON cs.id = csv.code_system_id
    JOIN terminology.terminology_sources s ON s.id = cs.source_id
   WHERE s.code LIKE 'NUTRITION\_%'
)
SELECT (SELECT count(*) FROM mine) AS conceptos,
       (SELECT count(*) FROM terminology.concept_designations d JOIN mine m ON m.id = d.concept_id) AS designaciones,
       (SELECT count(*) FROM terminology.concept_properties p JOIN mine m ON m.id = p.concept_id) AS propiedades,
       (SELECT count(*) FROM terminology.concept_relationships r JOIN mine m ON m.id = r.source_concept_id) AS relaciones;
\echo '== PROBLEMAS (cada fila debe ser 0) =='
WITH mine AS (
  SELECT cc.* FROM terminology.catalog_concepts cc
    JOIN terminology.code_system_versions csv ON csv.id = cc.code_system_version_id
    JOIN terminology.code_systems cs ON cs.id = csv.code_system_id
    JOIN terminology.terminology_sources s ON s.id = cs.source_id
   WHERE s.code LIKE 'NUTRITION\_%'
)
SELECT 'conceptos sin versión (huérfanos)' AS control, count(*) AS n FROM terminology.catalog_concepts cc LEFT JOIN terminology.code_system_versions v ON v.id = cc.code_system_version_id WHERE v.id IS NULL
UNION ALL SELECT 'duplicados (versión, código)', count(*) FROM (SELECT code_system_version_id, code FROM terminology.catalog_concepts GROUP BY 1, 2 HAVING count(*) > 1) d
UNION ALL SELECT 'display nulo o vacío', count(*) FROM mine WHERE display IS NULL OR btrim(display) = ''
UNION ALL SELECT 'code nulo o vacío', count(*) FROM mine WHERE code IS NULL OR btrim(code) = ''
UNION ALL SELECT 'state_concept_id nulo', count(*) FROM mine WHERE state_concept_id IS NULL
UNION ALL SELECT 'sin propiedad nutrition_provenance', count(*) FROM mine m WHERE NOT EXISTS (SELECT 1 FROM terminology.concept_properties p WHERE p.concept_id = m.id AND p.property_code = 'nutrition_provenance')
UNION ALL SELECT 'sin propiedad source_license', count(*) FROM mine m WHERE NOT EXISTS (SELECT 1 FROM terminology.concept_properties p WHERE p.concept_id = m.id AND p.property_code = 'source_license')
UNION ALL SELECT 'sin designación', count(*) FROM mine m WHERE NOT EXISTS (SELECT 1 FROM terminology.concept_designations d WHERE d.concept_id = m.id)
UNION ALL SELECT 'procedencia sin sha256 de 64 hex', count(*) FROM terminology.concept_properties p JOIN mine m ON m.id = p.concept_id WHERE p.property_code = 'nutrition_provenance' AND (p.value_json->>'sourceSha256') !~ '^[0-9a-f]{64}$'
UNION ALL SELECT 'procedencia sin licencia', count(*) FROM terminology.concept_properties p JOIN mine m ON m.id = p.concept_id WHERE p.property_code = 'nutrition_provenance' AND coalesce(p.value_json->>'license', '') = ''
UNION ALL SELECT 'designaciones sin concepto', count(*) FROM terminology.concept_designations d LEFT JOIN terminology.catalog_concepts c ON c.id = d.concept_id WHERE c.id IS NULL
UNION ALL SELECT 'propiedades sin concepto', count(*) FROM terminology.concept_properties p LEFT JOIN terminology.catalog_concepts c ON c.id = p.concept_id WHERE c.id IS NULL
UNION ALL SELECT 'propiedades con value_json nulo', count(*) FROM terminology.concept_properties WHERE value_json IS NULL OR value_json = 'null'::jsonb
UNION ALL SELECT 'relaciones con extremo ausente', count(*) FROM terminology.concept_relationships r LEFT JOIN terminology.catalog_concepts a ON a.id = r.source_concept_id LEFT JOIN terminology.catalog_concepts b ON b.id = r.target_concept_id WHERE a.id IS NULL OR b.id IS NULL
UNION ALL SELECT 'auto-relaciones', count(*) FROM terminology.concept_relationships WHERE source_concept_id = target_concept_id
UNION ALL SELECT 'code systems NUTRITION sin versión por defecto', count(*) FROM terminology.code_systems cs JOIN terminology.terminology_sources s ON s.id = cs.source_id WHERE s.code LIKE 'NUTRITION\_%' AND NOT EXISTS (SELECT 1 FROM terminology.code_system_versions v WHERE v.code_system_id = cs.id AND v.is_default)
UNION ALL SELECT 'code systems con más de una versión por defecto', count(*) FROM (SELECT code_system_id FROM terminology.code_system_versions WHERE is_default GROUP BY 1 HAVING count(*) > 1) x
UNION ALL SELECT 'lotes de importación huérfanos', count(*) FROM terminology.catalog_import_batches b LEFT JOIN terminology.code_system_versions v ON v.id = b.code_system_version_id WHERE v.id IS NULL;
\echo '== relaciones is-a por code system de origen =='
SELECT cs.internal_code, count(*) AS relaciones
  FROM terminology.concept_relationships r
  JOIN terminology.catalog_concepts a ON a.id = r.source_concept_id
  JOIN terminology.code_system_versions v ON v.id = a.code_system_version_id
  JOIN terminology.code_systems cs ON cs.id = v.code_system_id
  JOIN terminology.terminology_sources s ON s.id = cs.source_id
 WHERE s.code LIKE 'NUTRITION\_%' GROUP BY 1 ORDER BY 1;
\echo '== lotes: leídos vs insertados (deben coincidir en la primera corrida) =='
SELECT count(*) AS lotes, sum(total_read) AS leidos, sum(total_inserted) AS insertados FROM terminology.catalog_import_batches b JOIN terminology.terminology_sources s ON s.id = b.source_id WHERE s.code LIKE 'NUTRITION\_%';
