\echo '--- conceptos por code system'
select cs.internal_code, count(*) from terminology.catalog_concepts c join terminology.code_system_versions v on v.id=c.code_system_version_id join terminology.code_systems cs on cs.id=v.code_system_id group by 1 order by 2 desc;
\echo '--- huerfanos: conceptos sin designacion preferida ES'
select count(*) from terminology.catalog_concepts c where c.code_system_version_id in (select id from terminology.code_system_versions where code_system_id in (select id from terminology.code_systems where internal_code not in ('mantra-core'))) and not exists (select 1 from terminology.concept_designations d where d.concept_id=c.id and d.preferred);
\echo '--- huerfanos: conceptos sin miembro de glossary-all-terms'
select count(*) from terminology.catalog_concepts c where c.code_system_version_id in (select v.id from terminology.code_system_versions v join terminology.code_systems cs on cs.id=v.code_system_id where cs.internal_code<>'mantra-core') and not exists (select 1 from terminology.value_set_members m join terminology.value_set_versions vv on vv.id=m.value_set_version_id join terminology.value_sets vs on vs.id=vv.value_set_id where m.concept_id=c.id and vs.internal_code='glossary-all-terms');
\echo '--- duplicados: (code_system_version, code) repetidos'
select count(*) from (select code_system_version_id, code from terminology.catalog_concepts group by 1,2 having count(*)>1) x;
\echo '--- duplicados: slug repetido'
select count(*) from (select value_json::text from terminology.concept_properties where property_code='glossary-slug' group by 1 having count(*)>1) x;
\echo '--- nulos indebidos: display vacio / definicion vacia'
select count(*) filter (where display is null or btrim(display)='') as display_vacio, count(*) filter (where definition is not null and btrim(definition)='') as definicion_vacia from terminology.catalog_concepts;
\echo '--- nulos indebidos: procedencia ausente (source_url, source_retrieved_at, source_license)'
select c.code_system_version_id is not null as ok, count(*) from terminology.catalog_concepts c where c.code_system_version_id in (select v.id from terminology.code_system_versions v join terminology.code_systems cs on cs.id=v.code_system_id where cs.internal_code<>'mantra-core') and (select count(*) from terminology.concept_properties p where p.concept_id=c.id and p.property_code in ('source_url','source_retrieved_at','source_license'))<3 group by 1;
\echo '--- relaciones: extremos inexistentes'
select count(*) from terminology.concept_relationships r where not exists (select 1 from terminology.catalog_concepts c where c.id=r.source_concept_id) or not exists (select 1 from terminology.catalog_concepts c where c.id=r.target_concept_id);
\echo '--- lotes de importacion'
select count(*) from terminology.catalog_import_batches;
