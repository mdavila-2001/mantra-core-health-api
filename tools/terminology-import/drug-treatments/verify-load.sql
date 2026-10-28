-- =============================================================================
-- Verificación de integridad de la carga de tratamientos farmacológicos.
-- Solo lectura. Correr contra el Postgres donde se cargó:
--   psql -d <base> -f tools/terminology-import/drug-treatments/verify-load.sql
-- Cada consulta dice qué se espera. «0 filas» en las de huérfanos/duplicados/nulos es lo correcto.
-- =============================================================================
\pset pager off
\echo '--- 1. Conceptos, propiedades y relaciones por code system (drug-treatment-*)'
SELECT cs.internal_code,
       count(DISTINCT cc.id) AS conceptos,
       (SELECT count(*) FROM terminology.concept_properties p JOIN terminology.catalog_concepts c2 ON c2.id = p.concept_id
          JOIN terminology.code_system_versions v2 ON v2.id = c2.code_system_version_id WHERE v2.code_system_id = cs.id) AS propiedades
  FROM terminology.code_systems cs
  JOIN terminology.code_system_versions v ON v.code_system_id = cs.id
  JOIN terminology.catalog_concepts cc ON cc.code_system_version_id = v.id
 WHERE cs.internal_code LIKE 'drug-treatment-%'
 GROUP BY cs.id, cs.internal_code ORDER BY cs.internal_code;

\echo '--- 2. Relaciones estructurales por tipo (assertion:drug / assertion:condition)'
SELECT t.code AS tipo, count(*) AS relaciones
  FROM terminology.concept_relationships r
  JOIN terminology.catalog_concepts t ON t.id = r.relationship_type_concept_id
  JOIN terminology.code_system_versions tv ON tv.id = t.code_system_version_id
  JOIN terminology.code_systems tcs ON tcs.id = tv.code_system_id AND tcs.internal_code = 'drug-treatment-relation-types'
 GROUP BY t.code ORDER BY t.code;

\echo '--- 3. HUÉRFANOS (esperado: 0 filas): relaciones cuyo origen no es una afirmación, o cuyo destino/tipo no existe'
SELECT 'origen no es afirmación' AS problema, count(*) FROM terminology.concept_relationships r
  JOIN terminology.catalog_concepts t ON t.id = r.relationship_type_concept_id
  JOIN terminology.code_system_versions tv ON tv.id = t.code_system_version_id
  JOIN terminology.code_systems tcs ON tcs.id = tv.code_system_id AND tcs.internal_code = 'drug-treatment-relation-types'
 WHERE NOT EXISTS (SELECT 1 FROM terminology.catalog_concepts s JOIN terminology.code_system_versions sv ON sv.id = s.code_system_version_id
                     JOIN terminology.code_systems scs ON scs.id = sv.code_system_id
                    WHERE s.id = r.source_concept_id AND scs.internal_code LIKE 'drug-treatment-assertions-%')
HAVING count(*) > 0
UNION ALL
SELECT 'destino inexistente', count(*) FROM terminology.concept_relationships r
 WHERE NOT EXISTS (SELECT 1 FROM terminology.catalog_concepts c WHERE c.id = r.target_concept_id) HAVING count(*) > 0
UNION ALL
SELECT 'propiedad sin concepto', count(*) FROM terminology.concept_properties p
 WHERE NOT EXISTS (SELECT 1 FROM terminology.catalog_concepts c WHERE c.id = p.concept_id) HAVING count(*) > 0
UNION ALL
SELECT 'afirmación con tipo de relación que no existe en drug-treatment-relation-types', count(*)
  FROM terminology.concept_properties p
  JOIN terminology.catalog_concepts c ON c.id = p.concept_id
  JOIN terminology.code_system_versions v ON v.id = c.code_system_version_id
  JOIN terminology.code_systems cs ON cs.id = v.code_system_id AND cs.internal_code LIKE 'drug-treatment-assertions-%'
 WHERE p.property_code = 'assertion_relation_type'
   AND NOT EXISTS (SELECT 1 FROM terminology.catalog_concepts t JOIN terminology.code_system_versions tv ON tv.id = t.code_system_version_id
                     JOIN terminology.code_systems tcs ON tcs.id = tv.code_system_id AND tcs.internal_code = 'drug-treatment-relation-types'
                    WHERE t.code = trim(both '"' from p.value_json::text))
HAVING count(*) > 0;

\echo '--- 4. DUPLICADOS (esperado: 0 filas): (code system versión, code) repetido en las afirmaciones'
SELECT cc.code_system_version_id, cc.code, count(*) FROM terminology.catalog_concepts cc
  JOIN terminology.code_system_versions v ON v.id = cc.code_system_version_id
  JOIN terminology.code_systems cs ON cs.id = v.code_system_id
 WHERE cs.internal_code LIKE 'drug-treatment-%'
 GROUP BY 1, 2 HAVING count(*) > 1;

\echo '--- 5. NULOS INDEBIDOS (esperado: 0 filas): afirmación sin alguna propiedad de procedencia obligatoria'
WITH req(property_code) AS (VALUES ('assertion_relation_type'), ('assertion_polarity'), ('assertion_drug_codes'), ('assertion_condition_codes'),
       ('source_name'), ('source_record_id'), ('source_url'), ('source_version'), ('source_retrieved_at'), ('source_license'), ('source_file'), ('source_file_sha256')),
     a AS (SELECT cc.id, cs.internal_code FROM terminology.catalog_concepts cc
             JOIN terminology.code_system_versions v ON v.id = cc.code_system_version_id
             JOIN terminology.code_systems cs ON cs.id = v.code_system_id
            WHERE cs.internal_code LIKE 'drug-treatment-assertions-%')
SELECT a.internal_code, r.property_code AS falta, count(*) AS afirmaciones
  FROM a CROSS JOIN req r
 WHERE NOT EXISTS (SELECT 1 FROM terminology.concept_properties p WHERE p.concept_id = a.id AND p.property_code = r.property_code)
 GROUP BY 1, 2 ORDER BY 1, 2;

\echo '--- 6. Procedencia de las fuentes HTTP: sin commit, con release y URL del archivo (esperado: 0 filas con falta)'
SELECT a.internal_code, count(*) AS sin_release_ni_commit FROM (
  SELECT cc.id, cs.internal_code FROM terminology.catalog_concepts cc
    JOIN terminology.code_system_versions v ON v.id = cc.code_system_version_id
    JOIN terminology.code_systems cs ON cs.id = v.code_system_id
   WHERE cs.internal_code LIKE 'drug-treatment-assertions-%') a
 WHERE NOT EXISTS (SELECT 1 FROM terminology.concept_properties p WHERE p.concept_id = a.id AND p.property_code IN ('source_commit', 'source_release'))
 GROUP BY 1;

\echo '--- 7. Polaridad por code system (positiva = tratamiento; el resto NO se muestra como tratamiento)'
SELECT cs.internal_code, trim(both '"' from p.value_json::text) AS polaridad, count(*)
  FROM terminology.concept_properties p
  JOIN terminology.catalog_concepts c ON c.id = p.concept_id
  JOIN terminology.code_system_versions v ON v.id = c.code_system_version_id
  JOIN terminology.code_systems cs ON cs.id = v.code_system_id AND cs.internal_code LIKE 'drug-treatment-assertions-%'
 WHERE p.property_code = 'assertion_polarity'
 GROUP BY 1, 2 ORDER BY 1, 2;

\echo '--- 8. Afirmaciones enlazadas a un fármaco / a una enfermedad ya cargados (por código exacto), por code system'
SELECT cs.internal_code,
       count(*) AS afirmaciones,
       count(*) FILTER (WHERE EXISTS (SELECT 1 FROM terminology.concept_relationships r JOIN terminology.catalog_concepts t ON t.id = r.relationship_type_concept_id
                                       WHERE r.source_concept_id = c.id AND t.code = 'assertion:drug')) AS con_farmaco,
       count(*) FILTER (WHERE EXISTS (SELECT 1 FROM terminology.concept_relationships r JOIN terminology.catalog_concepts t ON t.id = r.relationship_type_concept_id
                                       WHERE r.source_concept_id = c.id AND t.code = 'assertion:condition')) AS con_enfermedad
  FROM terminology.catalog_concepts c
  JOIN terminology.code_system_versions v ON v.id = c.code_system_version_id
  JOIN terminology.code_systems cs ON cs.id = v.code_system_id AND cs.internal_code LIKE 'drug-treatment-assertions-%'
 GROUP BY 1 ORDER BY 1;
