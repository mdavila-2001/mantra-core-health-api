-- Integridad de la carga de interop-vocab (psql -d <base desechable> -f verify-load.sql). Todas las consultas de "problemas" deben dar 0.
\pset footer off
\echo '== conteos por fuente de esta carga =='
SELECT s.code AS fuente, count(DISTINCT cs.id) AS code_systems, count(DISTINCT csv.id) AS versiones, count(cc.id) AS conceptos
  FROM terminology.terminology_sources s
  JOIN terminology.code_systems cs ON cs.source_id = s.id
  JOIN terminology.code_system_versions csv ON csv.code_system_id = cs.id
  LEFT JOIN terminology.catalog_concepts cc ON cc.code_system_version_id = csv.id
 WHERE s.code LIKE 'INTEROP\_%' GROUP BY 1 ORDER BY 1;
\echo '== value sets / miembros / mapas =='
SELECT (SELECT count(*) FROM terminology.value_sets WHERE internal_code ~ '^(hl7-tho-vs|fhir-vs|fhir-ext-vs):') AS value_sets,
       (SELECT count(*) FROM terminology.value_set_versions v JOIN terminology.value_sets s ON s.id = v.value_set_id WHERE s.internal_code ~ '^(hl7-tho-vs|fhir-vs|fhir-ext-vs):') AS value_set_versions,
       (SELECT count(*) FROM terminology.value_set_members m JOIN terminology.value_set_versions v ON v.id = m.value_set_version_id JOIN terminology.value_sets s ON s.id = v.value_set_id WHERE s.internal_code ~ '^(hl7-tho-vs|fhir-vs|fhir-ext-vs):') AS miembros,
       (SELECT count(*) FROM terminology.concept_maps WHERE context LIKE 'http%') AS concept_maps;
\echo '== PROBLEMAS (cada fila debe ser 0) =='
WITH mine AS (
  SELECT cc.* FROM terminology.catalog_concepts cc
    JOIN terminology.code_system_versions csv ON csv.id = cc.code_system_version_id
    JOIN terminology.code_systems cs ON cs.id = csv.code_system_id
    JOIN terminology.terminology_sources s ON s.id = cs.source_id
   WHERE s.code LIKE 'INTEROP\_%'
)
SELECT 'conceptos sin versión (huérfanos)' AS control, count(*) AS n FROM terminology.catalog_concepts cc LEFT JOIN terminology.code_system_versions v ON v.id = cc.code_system_version_id WHERE v.id IS NULL
UNION ALL SELECT 'duplicados (versión, código)', count(*) FROM (SELECT code_system_version_id, code FROM terminology.catalog_concepts GROUP BY 1, 2 HAVING count(*) > 1) d
UNION ALL SELECT 'display nulo o vacío', count(*) FROM mine WHERE display IS NULL OR btrim(display) = ''
UNION ALL SELECT 'code nulo o vacío', count(*) FROM mine WHERE code IS NULL OR btrim(code) = ''
UNION ALL SELECT 'state_concept_id nulo', count(*) FROM mine WHERE state_concept_id IS NULL
UNION ALL SELECT 'sin propiedad interop_provenance', count(*) FROM mine m WHERE NOT EXISTS (SELECT 1 FROM terminology.concept_properties p WHERE p.concept_id = m.id AND p.property_code = 'interop_provenance')
UNION ALL SELECT 'sin propiedad source_license', count(*) FROM mine m WHERE NOT EXISTS (SELECT 1 FROM terminology.concept_properties p WHERE p.concept_id = m.id AND p.property_code = 'source_license')
UNION ALL SELECT 'designaciones sin concepto', count(*) FROM terminology.concept_designations d LEFT JOIN terminology.catalog_concepts c ON c.id = d.concept_id WHERE c.id IS NULL
UNION ALL SELECT 'propiedades sin concepto', count(*) FROM terminology.concept_properties p LEFT JOIN terminology.catalog_concepts c ON c.id = p.concept_id WHERE c.id IS NULL
UNION ALL SELECT 'propiedades con value_json nulo', count(*) FROM terminology.concept_properties WHERE value_json IS NULL OR value_json = 'null'::jsonb
UNION ALL SELECT 'relaciones con extremo ausente', count(*) FROM terminology.concept_relationships r LEFT JOIN terminology.catalog_concepts a ON a.id = r.source_concept_id LEFT JOIN terminology.catalog_concepts b ON b.id = r.target_concept_id WHERE a.id IS NULL OR b.id IS NULL
UNION ALL SELECT 'relaciones entre versiones distintas', count(*) FROM terminology.concept_relationships r JOIN terminology.catalog_concepts a ON a.id = r.source_concept_id JOIN terminology.catalog_concepts b ON b.id = r.target_concept_id WHERE a.code_system_version_id <> b.code_system_version_id
UNION ALL SELECT 'auto-relaciones', count(*) FROM terminology.concept_relationships WHERE source_concept_id = target_concept_id
UNION ALL SELECT 'miembros sin concepto', count(*) FROM terminology.value_set_members m LEFT JOIN terminology.catalog_concepts c ON c.id = m.concept_id WHERE c.id IS NULL
UNION ALL SELECT 'versiones de value set sin miembros', count(*) FROM terminology.value_set_versions v JOIN terminology.value_sets s ON s.id = v.value_set_id WHERE s.internal_code ~ '^(hl7-tho-vs|fhir-vs|fhir-ext-vs):' AND NOT EXISTS (SELECT 1 FROM terminology.value_set_members m WHERE m.value_set_version_id = v.id)
UNION ALL SELECT 'code systems de INTEROP sin versión por defecto', count(*) FROM terminology.code_systems cs JOIN terminology.terminology_sources s ON s.id = cs.source_id WHERE s.code LIKE 'INTEROP\_%' AND cs.internal_code <> 'ucum' AND NOT EXISTS (SELECT 1 FROM terminology.code_system_versions v WHERE v.code_system_id = cs.id AND v.is_default)
UNION ALL SELECT 'code systems con más de una versión por defecto', count(*) FROM (SELECT code_system_id FROM terminology.code_system_versions WHERE is_default GROUP BY 1 HAVING count(*) > 1) x
UNION ALL SELECT 'value sets con más de una versión por defecto', count(*) FROM (SELECT value_set_id FROM terminology.value_set_versions WHERE is_default GROUP BY 1 HAVING count(*) > 1) x
UNION ALL SELECT 'concept_maps con extremo ausente', count(*) FROM terminology.concept_maps cm LEFT JOIN terminology.catalog_concepts a ON a.id = cm.source_concept_id LEFT JOIN terminology.catalog_concepts b ON b.id = cm.target_concept_id WHERE a.id IS NULL OR b.id IS NULL OR cm.equivalence_concept_id IS NULL
UNION ALL SELECT 'lotes de importación huérfanos', count(*) FROM terminology.catalog_import_batches b LEFT JOIN terminology.code_system_versions v ON v.id = b.code_system_version_id WHERE v.id IS NULL;
\echo '== lotes: leídos vs insertados (deben coincidir en la primera corrida) =='
SELECT count(*) AS lotes, sum(total_read) AS leidos, sum(total_inserted) AS insertados FROM terminology.catalog_import_batches b JOIN terminology.terminology_sources s ON s.id = b.source_id WHERE s.code LIKE 'INTEROP\_%';
