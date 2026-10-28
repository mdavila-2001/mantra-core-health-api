-- Consultas de integridad de la carga de genética en la base DESECHABLE.
-- Sólo mide lo que cargó ESTE importador: sus versiones son las que traen `code_system_versions.checksum` (SHA-256 del NDJSON); las versiones que cargó
-- dictionaries/ en hgnc y sequence-ontology (sin checksum) no se miden acá (ver coexistence.sql).
-- Uso: psql -h 127.0.0.1 -p 55442 -U mantra -d c12_test -f tools/terminology-import/genetics/test/disposable-db/integrity.sql
\pset pager off
\set systems '''hgnc'',''hgnc-gene-group'',''ncbi-gene-hs'',''medgen'',''sequence-ontology'',''clinvar-terms'',''clinvar-functional'',''clingen-terms'',''hgvs-syntax'',''ga4gh-vrs'''

\echo '== 1. conceptos por code system y versión'
SELECT cs.internal_code, v.version, count(*) AS conceptos
  FROM terminology.catalog_concepts c
  JOIN terminology.code_system_versions v ON v.id = c.code_system_version_id
  JOIN terminology.code_systems cs ON cs.id = v.code_system_id
 WHERE cs.internal_code IN (:systems) AND v.checksum IS NOT NULL
 GROUP BY 1,2 ORDER BY 1;

\echo '== 2. duplicados por (versión del code system, code) — la clave única del modelo: debe dar 0 filas'
SELECT cs.internal_code, v.version, c.code, count(*)
  FROM terminology.catalog_concepts c
  JOIN terminology.code_system_versions v ON v.id = c.code_system_version_id
  JOIN terminology.code_systems cs ON cs.id = v.code_system_id
 WHERE cs.internal_code IN (:systems) AND v.checksum IS NOT NULL
 GROUP BY 1,2,3 HAVING count(*) > 1;

\echo '== 2b. duplicados por (code system, code) A TRAVÉS de versiones. Esperado: 0 en los 8 sistemas propios; en hgnc y sequence-ontology sólo si dictionaries/ cargó su versión en la misma base (ver coexistence.sql)'
SELECT cs.internal_code, count(DISTINCT v.id) AS versiones, count(*) FILTER (WHERE d.n > 1) AS filas_de_codigos_repetidos_entre_versiones
  FROM terminology.code_systems cs
  JOIN terminology.code_system_versions v ON v.code_system_id = cs.id
  JOIN terminology.catalog_concepts c ON c.code_system_version_id = v.id
  JOIN (SELECT v2.code_system_id, c2.code, count(*) AS n FROM terminology.catalog_concepts c2 JOIN terminology.code_system_versions v2 ON v2.id = c2.code_system_version_id GROUP BY 1,2) d
    ON d.code_system_id = cs.id AND d.code = c.code
 WHERE cs.internal_code IN (:systems)
 GROUP BY 1 ORDER BY 1;

\echo '== 3. nulos o vacíos indebidos en code/display, y definición cargada en la columna en castellano (debe ser NULL): todo 0'
SELECT cs.internal_code,
       count(*) FILTER (WHERE c.code IS NULL OR c.code = '') AS code_vacio,
       count(*) FILTER (WHERE c.display IS NULL OR c.display = '') AS display_vacio,
       count(*) FILTER (WHERE c.definition IS NOT NULL) AS definition_no_nula,
       count(*) FILTER (WHERE c.state_concept_id IS NULL) AS sin_estado
  FROM terminology.catalog_concepts c
  JOIN terminology.code_system_versions v ON v.id = c.code_system_version_id
  JOIN terminology.code_systems cs ON cs.id = v.code_system_id
 WHERE cs.internal_code IN (:systems) AND v.checksum IS NOT NULL
 GROUP BY 1 ORDER BY 1;

\echo '== 4. conceptos sin designación preferida: debe dar 0 por sistema'
SELECT cs.internal_code, count(*) AS sin_preferida
  FROM terminology.catalog_concepts c
  JOIN terminology.code_system_versions v ON v.id = c.code_system_version_id
  JOIN terminology.code_systems cs ON cs.id = v.code_system_id
 WHERE cs.internal_code IN (:systems) AND v.checksum IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM terminology.concept_designations d WHERE d.concept_id = c.id AND d.preferred)
 GROUP BY 1;

\echo '== 5. procedencia por fila: conceptos a los que les falta alguna de las 8 propiedades de procedencia: debe dar 0'
SELECT cs.internal_code, count(*) AS con_procedencia_incompleta
  FROM terminology.catalog_concepts c
  JOIN terminology.code_system_versions v ON v.id = c.code_system_version_id
  JOIN terminology.code_systems cs ON cs.id = v.code_system_id
 WHERE cs.internal_code IN (:systems) AND v.checksum IS NOT NULL
   AND (SELECT count(DISTINCT p.property_code) FROM terminology.concept_properties p
         WHERE p.concept_id = c.id
           AND p.property_code IN ('code_system','source','source_record_id','source_url','source_version','source_retrieved_at','source_input_sha256','source_license')) <> 8
 GROUP BY 1;

\echo '== 6. huérfanos: designaciones, propiedades, relaciones y mapas cuyo concepto no existe: debe dar 0 en todo'
SELECT (SELECT count(*) FROM terminology.concept_designations d LEFT JOIN terminology.catalog_concepts c ON c.id = d.concept_id WHERE c.id IS NULL) AS designaciones,
       (SELECT count(*) FROM terminology.concept_properties p LEFT JOIN terminology.catalog_concepts c ON c.id = p.concept_id WHERE c.id IS NULL) AS propiedades,
       (SELECT count(*) FROM terminology.concept_relationships r LEFT JOIN terminology.catalog_concepts s ON s.id = r.source_concept_id LEFT JOIN terminology.catalog_concepts t ON t.id = r.target_concept_id WHERE s.id IS NULL OR t.id IS NULL) AS relaciones,
       (SELECT count(*) FROM terminology.concept_maps m LEFT JOIN terminology.catalog_concepts s ON s.id = m.source_concept_id LEFT JOIN terminology.catalog_concepts t ON t.id = m.target_concept_id WHERE s.id IS NULL OR t.id IS NULL) AS mapas;

\echo '== 7. autorreferencias y duplicados de la clave natural (origen, destino, tipo) en relaciones y mapas DE GENÉTICA: debe dar 0'
CREATE TEMP VIEW gen_concepts AS
  SELECT c.id FROM terminology.catalog_concepts c
    JOIN terminology.code_system_versions v ON v.id = c.code_system_version_id
    JOIN terminology.code_systems cs ON cs.id = v.code_system_id
   WHERE cs.internal_code IN (:systems) AND v.checksum IS NOT NULL;
SELECT (SELECT count(*) FROM terminology.concept_relationships WHERE source_concept_id = target_concept_id AND source_concept_id IN (SELECT id FROM gen_concepts)) AS rel_autorref,
       (SELECT count(*) FROM (SELECT 1 FROM terminology.concept_relationships WHERE source_concept_id IN (SELECT id FROM gen_concepts) GROUP BY source_concept_id, target_concept_id, relationship_type_concept_id HAVING count(*) > 1) x) AS rel_duplicadas,
       (SELECT count(*) FROM terminology.concept_maps WHERE source_concept_id = target_concept_id AND source_concept_id IN (SELECT id FROM gen_concepts)) AS map_autorref,
       (SELECT count(*) FROM (SELECT 1 FROM terminology.concept_maps WHERE source_concept_id IN (SELECT id FROM gen_concepts) GROUP BY source_concept_id, target_concept_id HAVING count(*) > 1) x) AS map_duplicados;

\echo '== 8. relaciones de genética por tipo (is-a / part-of) y sistema de origen'
SELECT cs.internal_code AS sistema_origen, t.code AS tipo, count(*) AS aristas
  FROM terminology.concept_relationships r
  JOIN terminology.catalog_concepts s ON s.id = r.source_concept_id
  JOIN terminology.code_system_versions v ON v.id = s.code_system_version_id
  JOIN terminology.code_systems cs ON cs.id = v.code_system_id
  JOIN terminology.catalog_concepts t ON t.id = r.relationship_type_concept_id
 WHERE cs.internal_code IN (:systems) AND v.checksum IS NOT NULL
 GROUP BY 1,2 ORDER BY 1,2;

\echo '== 9. cruces por código exacto de genética: sistema de origen → sistema de destino'
SELECT cso.internal_code AS origen, cst.internal_code AS destino, count(*) AS cruces,
       count(*) FILTER (WHERE m.equivalence_concept_id IS NOT NULL) AS con_equivalencia_afirmada
  FROM terminology.concept_maps m
  JOIN terminology.catalog_concepts so_ ON so_.id = m.source_concept_id
  JOIN terminology.code_system_versions vo ON vo.id = so_.code_system_version_id
  JOIN terminology.code_systems cso ON cso.id = vo.code_system_id
  JOIN terminology.catalog_concepts st ON st.id = m.target_concept_id
  JOIN terminology.code_system_versions vt ON vt.id = st.code_system_version_id
  JOIN terminology.code_systems cst ON cst.id = vt.code_system_id
 WHERE cso.internal_code IN (:systems) AND vo.checksum IS NOT NULL
 GROUP BY 1,2 ORDER BY 1,2;

\echo '== 10. cruces sin contexto, y cruces cuyo código de destino NO figura entre los xrefs que declara el concepto de origen: debe dar 0'
SELECT cso.internal_code AS origen, cst.internal_code AS destino,
       count(*) AS cruces,
       count(*) FILTER (WHERE m.context IS NULL OR m.context = '') AS sin_contexto,
       count(*) FILTER (WHERE cso.internal_code <> 'clinvar-functional' AND NOT EXISTS (
         SELECT 1 FROM terminology.concept_properties p, jsonb_array_elements_text(p.value_json) x
          WHERE p.concept_id = m.source_concept_id AND p.property_code = 'xrefs' AND jsonb_typeof(p.value_json) = 'array'
            AND (x = 'ENTREZ:' || st.code OR x = 'HGNC:' || st.code OR x = 'MESH:' || st.code OR x = 'MONDO:' || st.code OR x = 'ORPHANET:Orphanet_' || st.code OR x = 'ORPHANET:' || st.code OR x = 'NCI:' || st.code OR x = 'OMIM:' || st.code))) AS destino_no_declarado
  FROM terminology.concept_maps m
  JOIN terminology.catalog_concepts so_ ON so_.id = m.source_concept_id
  JOIN terminology.code_system_versions vo ON vo.id = so_.code_system_version_id
  JOIN terminology.code_systems cso ON cso.id = vo.code_system_id
  JOIN terminology.catalog_concepts st ON st.id = m.target_concept_id
  JOIN terminology.code_system_versions vt ON vt.id = st.code_system_version_id
  JOIN terminology.code_systems cst ON cst.id = vt.code_system_id
 WHERE cso.internal_code IN (:systems) AND vo.checksum IS NOT NULL
 GROUP BY 1,2 ORDER BY 1,2;

\echo '== 11. propiedades por sistema y filas de import batch'
SELECT cs.internal_code, count(DISTINCT p.concept_id) AS conceptos_con_props, count(*) AS propiedades
  FROM terminology.concept_properties p
  JOIN terminology.catalog_concepts c ON c.id = p.concept_id
  JOIN terminology.code_system_versions v ON v.id = c.code_system_version_id
  JOIN terminology.code_systems cs ON cs.id = v.code_system_id
 WHERE cs.internal_code IN (:systems) AND v.checksum IS NOT NULL
 GROUP BY 1 ORDER BY 1;
SELECT cs.internal_code, b.total_read, b.total_inserted, b.total_errors, left(b.checksum, 16) AS checksum
  FROM terminology.catalog_import_batches b
  JOIN terminology.code_system_versions v ON v.id = b.code_system_version_id
  JOIN terminology.code_systems cs ON cs.id = v.code_system_id
 WHERE cs.internal_code IN (:systems) AND v.checksum IS NOT NULL ORDER BY 1;

\echo '== 12. muestra: HGNC:5 (A1BG) con su cruce a NCBI Gene, su grupo y la procedencia'
SELECT c.code, c.display,
       (SELECT string_agg(p.property_code || '=' || left(p.value_json::text, 70), E'\n   ' ORDER BY p.property_code) FROM terminology.concept_properties p WHERE p.concept_id = c.id AND p.property_code IN ('source','source_version','source_url','source_license','approved_name','cytogenetic_location')) AS propiedades,
       (SELECT string_agg(t.code || ' ' || t.display, ', ') FROM terminology.concept_maps m JOIN terminology.catalog_concepts t ON t.id = m.target_concept_id WHERE m.source_concept_id = c.id) AS cruces,
       (SELECT string_agg(g.code || ' ' || g.display, ', ') FROM terminology.concept_relationships r JOIN terminology.catalog_concepts g ON g.id = r.target_concept_id WHERE r.source_concept_id = c.id) AS relaciones
  FROM terminology.catalog_concepts c
  JOIN terminology.code_system_versions v ON v.id = c.code_system_version_id
  JOIN terminology.code_systems cs ON cs.id = v.code_system_id
 WHERE cs.internal_code = 'hgnc' AND c.code = 'HGNC:5';
