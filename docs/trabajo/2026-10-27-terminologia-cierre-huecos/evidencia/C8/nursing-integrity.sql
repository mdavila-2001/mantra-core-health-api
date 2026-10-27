\echo '== conceptos por code system'
SELECT cs.internal_code, count(*) FROM terminology.catalog_concepts cc JOIN terminology.code_system_versions v ON v.id=cc.code_system_version_id JOIN terminology.code_systems cs ON cs.id=v.code_system_id WHERE cs.internal_code IN ('openehr-ckm','es-msssi-cmdic-13606','nursing-terminology-registry','omaha-system') GROUP BY 1 ORDER BY 1;
\echo '== duplicados por (versión, código)'
SELECT count(*) AS duplicados FROM (SELECT code_system_version_id, code FROM terminology.catalog_concepts GROUP BY 1,2 HAVING count(*)>1) d;
\echo '== relaciones huérfanas (origen o destino inexistente)'
SELECT count(*) AS huerfanas FROM terminology.concept_relationships r WHERE NOT EXISTS (SELECT 1 FROM terminology.catalog_concepts c WHERE c.id=r.source_concept_id) OR NOT EXISTS (SELECT 1 FROM terminology.catalog_concepts c WHERE c.id=r.target_concept_id);
\echo '== designaciones y propiedades huérfanas'
SELECT (SELECT count(*) FROM terminology.concept_designations d WHERE NOT EXISTS (SELECT 1 FROM terminology.catalog_concepts c WHERE c.id=d.concept_id)) AS designaciones_huerfanas, (SELECT count(*) FROM terminology.concept_properties p WHERE NOT EXISTS (SELECT 1 FROM terminology.catalog_concepts c WHERE c.id=p.concept_id)) AS propiedades_huerfanas;
\echo '== nulos indebidos (display vacío)'
SELECT count(*) AS display_nulo_o_vacio FROM terminology.catalog_concepts cc JOIN terminology.code_system_versions v ON v.id=cc.code_system_version_id JOIN terminology.code_systems cs ON cs.id=v.code_system_id WHERE cs.internal_code IN ('openehr-ckm','es-msssi-cmdic-13606','nursing-terminology-registry','omaha-system') AND (cc.display IS NULL OR btrim(cc.display)='');
\echo '== Omaha: conceptos sin procedencia (omaha-provenance) o sin licencia'
SELECT count(*) AS sin_procedencia FROM terminology.catalog_concepts cc JOIN terminology.code_system_versions v ON v.id=cc.code_system_version_id JOIN terminology.code_systems cs ON cs.id=v.code_system_id WHERE cs.internal_code='omaha-system' AND NOT EXISTS (SELECT 1 FROM terminology.concept_properties p WHERE p.concept_id=cc.id AND p.property_code='omaha-provenance' AND p.value_json #>> '{license,status}' IS NOT NULL AND p.value_json->>'sha256' IS NOT NULL);
\echo '== Omaha: problemas sin dominio padre / signos sin problema'
SELECT (SELECT count(*) FROM terminology.concept_properties p WHERE p.property_code='omaha_kind' AND p.value_json #>> '{}'='problem' AND NOT EXISTS (SELECT 1 FROM terminology.concept_relationships r WHERE r.source_concept_id=p.concept_id)) AS problemas_sin_dominio, (SELECT count(*) FROM terminology.concept_properties p WHERE p.property_code='omaha_kind' AND p.value_json #>> '{}'='sign-symptom' AND NOT EXISTS (SELECT 1 FROM terminology.concept_relationships r WHERE r.source_concept_id=p.concept_id)) AS signos_sin_problema;
\echo '== Omaha: conceptos por clase'
SELECT p.value_json #>> '{}' AS clase, count(*) FROM terminology.concept_properties p WHERE p.property_code='omaha_kind' GROUP BY 1 ORDER BY 2 DESC;
\echo '== Glasgow adulto: conceptos y puntajes cargados'
SELECT count(*) AS conceptos_glasgow FROM terminology.concept_properties p WHERE p.property_code='source_id' AND p.value_json #>> '{}' LIKE 'openEHR-EHR-OBSERVATION.glasgow_coma_scale.v1%';
\echo '== enlaces a LOINC (concept_maps con destino en loinc)'
SELECT count(*) AS mapas_loinc FROM terminology.concept_maps m JOIN terminology.catalog_concepts t ON t.id=m.target_concept_id JOIN terminology.code_system_versions v ON v.id=t.code_system_version_id JOIN terminology.code_systems cs ON cs.id=v.code_system_id WHERE cs.internal_code='loinc';
