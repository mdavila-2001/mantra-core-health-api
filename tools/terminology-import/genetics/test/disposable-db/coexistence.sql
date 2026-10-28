-- hgnc y sequence-ontology también los carga dictionaries/: ¿conviven como UN code system con dos versiones, sin duplicar filas por versión
-- ni quitarle el is_default a la otra?
\pset pager off
\echo '== code systems compartidos: versiones, conceptos por versión y cuál es la predeterminada'
SELECT cs.internal_code, cs.canonical_url, s.code AS fuente, v.version, v.is_default, count(c.id) AS conceptos
  FROM terminology.code_systems cs
  JOIN terminology.terminology_sources s ON s.id = cs.source_id
  JOIN terminology.code_system_versions v ON v.code_system_id = cs.id
  LEFT JOIN terminology.catalog_concepts c ON c.code_system_version_id = v.id
 WHERE cs.internal_code IN ('hgnc','sequence-ontology')
 GROUP BY 1,2,3,4,5 ORDER BY 1,4;
\echo '== un solo code system por internal_code y por URL canónica (debe ser 1 fila por sistema)'
SELECT internal_code, count(*) FROM terminology.code_systems WHERE internal_code IN ('hgnc','sequence-ontology') GROUP BY 1;
\echo '== ¿más de una versión predeterminada por code system? (debe dar 0 filas para los sistemas de genética propios; los compartidos se informan arriba)'
SELECT cs.internal_code, count(*) AS defaults FROM terminology.code_systems cs JOIN terminology.code_system_versions v ON v.code_system_id = cs.id WHERE v.is_default GROUP BY 1 HAVING count(*) > 1;
\echo '== mismo código en las dos versiones de hgnc (esperado: sí, son dos versiones, con ids distintos)'
SELECT count(*) AS codigos_en_ambas_versiones FROM (
  SELECT c.code FROM terminology.catalog_concepts c JOIN terminology.code_system_versions v ON v.id = c.code_system_version_id JOIN terminology.code_systems cs ON cs.id = v.code_system_id
   WHERE cs.internal_code = 'hgnc' GROUP BY c.code HAVING count(DISTINCT v.id) = 2) x;
