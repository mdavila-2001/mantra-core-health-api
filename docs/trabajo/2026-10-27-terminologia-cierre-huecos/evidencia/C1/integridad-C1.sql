\pset pager off
\echo '== conceptos por code system (versión) y nulos'
select cs.internal_code, count(c.id) conceptos,
       count(*) filter (where c.display is null or c.display='') display_vacio,
       count(*) filter (where c.code is null or c.code='') code_vacio,
       count(*) filter (where c.definition is not null) con_definicion,
       count(*) filter (where c.state_concept_id is null) sin_estado
from terminology.code_systems cs join terminology.code_system_versions v on v.code_system_id=cs.id
left join terminology.catalog_concepts c on c.code_system_version_id=v.id
where cs.internal_code not in ('mantra-core-internal') group by 1 order by 1;
\echo '== duplicados por (code_system, version, code): esperado 0'
select count(*) from (select v.code_system_id, v.id, c.code from terminology.catalog_concepts c join terminology.code_system_versions v on v.id=c.code_system_version_id group by 1,2,3 having count(*)>1) d;
\echo '== duplicados por (code_system, code) entre versiones: esperado 0'
select count(*) from (select v.code_system_id, c.code from terminology.catalog_concepts c join terminology.code_system_versions v on v.id=c.code_system_version_id group by 1,2 having count(*)>1) d;
\echo '== huérfanos: designaciones/propiedades/relaciones/mapas sin concepto: esperado 0'
select (select count(*) from terminology.concept_designations d left join terminology.catalog_concepts c on c.id=d.concept_id where c.id is null) designaciones,
       (select count(*) from terminology.concept_properties p left join terminology.catalog_concepts c on c.id=p.concept_id where c.id is null) propiedades,
       (select count(*) from terminology.concept_relationships r left join terminology.catalog_concepts a on a.id=r.source_concept_id left join terminology.catalog_concepts b on b.id=r.target_concept_id where a.id is null or b.id is null) relaciones,
       (select count(*) from terminology.concept_maps m left join terminology.catalog_concepts a on a.id=m.source_concept_id left join terminology.catalog_concepts b on b.id=m.target_concept_id where a.id is null or b.id is null) mapas;
\echo '== replaced_by huérfano: esperado 0'
select count(*) from terminology.catalog_concepts c left join terminology.catalog_concepts r on r.id=c.replaced_by_concept_id where c.replaced_by_concept_id is not null and r.id is null;
\echo '== designaciones: vacías, sin idioma, conceptos sin designación preferida (excluye sistemas de claves)'
select count(*) filter (where value is null or value='') vacias, count(*) filter (where language_concept_id is null) sin_idioma from terminology.concept_designations;
select cs.internal_code, count(*) sin_preferida from terminology.catalog_concepts c join terminology.code_system_versions v on v.id=c.code_system_version_id join terminology.code_systems cs on cs.id=v.code_system_id
 where cs.internal_code not in ('mantra-core-internal','decipher','icd10-who','icd11-foundation','omim','umls')
 and not exists (select 1 from terminology.concept_designations d where d.concept_id=c.id and d.preferred) group by 1 order by 1;
\echo '== procedencia por fila: conceptos con propiedad disease_provenance, por sistema (los de claves no la llevan)'
select cs.internal_code, count(*) conceptos, count(*) filter (where exists (select 1 from terminology.concept_properties p where p.concept_id=c.id and p.property_code='disease_provenance')) con_procedencia
 from terminology.catalog_concepts c join terminology.code_system_versions v on v.id=c.code_system_version_id join terminology.code_systems cs on cs.id=v.code_system_id
 where cs.internal_code<>'mantra-core-internal' group by 1 order by 1;
\echo '== self-loops en is-a: esperado 0'
select count(*) from terminology.concept_relationships where source_concept_id=target_concept_id;
\echo '== totales de tablas'
select (select count(*) from terminology.catalog_concepts) conceptos, (select count(*) from terminology.concept_designations) designaciones, (select count(*) from terminology.concept_properties) propiedades, (select count(*) from terminology.concept_relationships) relaciones, (select count(*) from terminology.concept_maps) mapas, (select count(*) from terminology.catalog_import_batches) lotes;
