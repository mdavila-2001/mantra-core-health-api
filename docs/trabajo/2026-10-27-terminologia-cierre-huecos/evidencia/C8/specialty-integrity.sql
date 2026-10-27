\echo '== conceptos nuevos por code system (FONASA, CUPS copias, CUPS 2025)'
SELECT cs.internal_code, count(*) FROM terminology.catalog_concepts cc JOIN terminology.code_system_versions v ON v.id=cc.code_system_version_id JOIN terminology.code_systems cs ON cs.id=v.code_system_id WHERE cs.internal_code IN ('fonasa-mle-2026','cups-co','cups-co-2706-2025') GROUP BY 1 ORDER BY 1;
\echo '== relaciones servicio -> especialidad'
SELECT count(*) AS relaciones FROM terminology.concept_relationships ;
\echo '== duplicados por (versión, código)'
SELECT count(*) AS duplicados FROM (SELECT code_system_version_id, code FROM terminology.catalog_concepts GROUP BY 1,2 HAVING count(*)>1) d;
\echo '== relaciones huérfanas'
SELECT count(*) AS huerfanas FROM terminology.concept_relationships r WHERE NOT EXISTS (SELECT 1 FROM terminology.catalog_concepts c WHERE c.id=r.source_concept_id) OR NOT EXISTS (SELECT 1 FROM terminology.catalog_concepts c WHERE c.id=r.target_concept_id);
\echo '== relaciones cuyo destino NO es una especialidad de VS_MEDICAL_SPECIALTY'
SELECT count(*) AS destino_no_especialidad FROM terminology.concept_relationships r WHERE NOT EXISTS (SELECT 1 FROM terminology.value_set_members m JOIN terminology.value_set_versions v ON v.id=m.value_set_version_id JOIN terminology.value_sets s ON s.id=v.value_set_id WHERE s.internal_code='VS_MEDICAL_SPECIALTY' AND m.concept_id=r.target_concept_id);
\echo '== value sets de servicios: miembros = relaciones'
SELECT (SELECT count(*) FROM terminology.value_set_members m JOIN terminology.value_set_versions v ON v.id=m.value_set_version_id JOIN terminology.value_sets s ON s.id=v.value_set_id WHERE s.internal_code LIKE 'VS_SPECIALTY_SERVICES_%') AS miembros, (SELECT count(*) FROM terminology.concept_relationships) AS relaciones;
\echo '== nulos indebidos'
SELECT count(*) AS display_vacio FROM terminology.catalog_concepts cc JOIN terminology.code_system_versions v ON v.id=cc.code_system_version_id JOIN terminology.code_systems cs ON cs.id=v.code_system_id WHERE cs.internal_code IN ('fonasa-mle-2026','cups-co','cups-co-2706-2025') AND (cc.display IS NULL OR btrim(cc.display)='');
\echo '== conceptos nuevos sin evidencia de especialidad'
SELECT count(*) AS sin_evidencia FROM terminology.catalog_concepts cc JOIN terminology.code_system_versions v ON v.id=cc.code_system_version_id JOIN terminology.code_systems cs ON cs.id=v.code_system_id WHERE cs.internal_code IN ('fonasa-mle-2026','cups-co','cups-co-2706-2025') AND NOT EXISTS (SELECT 1 FROM terminology.concept_properties p WHERE p.concept_id=cc.id AND p.property_code='specialty-service:evidence');
\echo '== Medicina del Trabajo (cierra el hueco de las copias CUPS)'
SELECT cc.code, cc.display FROM terminology.concept_relationships r JOIN terminology.catalog_concepts cc ON cc.id=r.source_concept_id JOIN terminology.catalog_concepts t ON t.id=r.target_concept_id WHERE t.code='MEDICINA_DEL_TRABAJO' ORDER BY 1;
