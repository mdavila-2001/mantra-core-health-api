\pset footer off
\echo == conceptos por code system (solo allergy-*)
select cs.internal_code, count(*) from terminology.catalog_concepts c join terminology.code_system_versions v on v.id=c.code_system_version_id join terminology.code_systems cs on cs.id=v.code_system_id where cs.internal_code like 'allergy-%' group by 1 order by 2 desc;
\echo == total conceptos allergy-*
select count(*) from terminology.catalog_concepts c join terminology.code_system_versions v on v.id=c.code_system_version_id join terminology.code_systems cs on cs.id=v.code_system_id where cs.internal_code like 'allergy-%';
\echo == duplicados (code system, code) -> esperado 0
select count(*) from (select cs.id, c.code from terminology.catalog_concepts c join terminology.code_system_versions v on v.id=c.code_system_version_id join terminology.code_systems cs on cs.id=v.code_system_id where cs.internal_code like 'allergy-%' group by 1,2 having count(*)>1) d;
\echo == nulos/vacios en code o display -> esperado 0
select count(*) from terminology.catalog_concepts c join terminology.code_system_versions v on v.id=c.code_system_version_id join terminology.code_systems cs on cs.id=v.code_system_id where cs.internal_code like 'allergy-%' and (nullif(trim(c.code),'') is null or nullif(trim(c.display),'') is null);
\echo == conceptos allergy-* sin propiedad allergy_provenance -> esperado 0
select count(*) from terminology.catalog_concepts c join terminology.code_system_versions v on v.id=c.code_system_version_id join terminology.code_systems cs on cs.id=v.code_system_id where cs.internal_code like 'allergy-%' and not exists (select 1 from terminology.concept_properties p where p.concept_id=c.id and p.property_code='allergy_provenance');
\echo == huerfanos: designaciones/propiedades/relaciones/miembros sin concepto -> esperado 0
select (select count(*) from terminology.concept_designations d where not exists (select 1 from terminology.catalog_concepts c where c.id=d.concept_id)) desig,
 (select count(*) from terminology.concept_properties d where not exists (select 1 from terminology.catalog_concepts c where c.id=d.concept_id)) prop,
 (select count(*) from terminology.concept_relationships r where not exists (select 1 from terminology.catalog_concepts c where c.id=r.source_concept_id) or not exists (select 1 from terminology.catalog_concepts c where c.id=r.target_concept_id)) rel,
 (select count(*) from terminology.value_set_members m where not exists (select 1 from terminology.catalog_concepts c where c.id=m.concept_id)) miembros;
\echo == duplicados de designacion/propiedad/relacion/miembro -> esperado 0
select (select count(*) from (select concept_id,property_code,value_json from terminology.concept_properties group by 1,2,3 having count(*)>1) x) prop_dup,
 (select count(*) from (select source_concept_id,target_concept_id,relationship_type_concept_id from terminology.concept_relationships group by 1,2,3 having count(*)>1) x) rel_dup,
 (select count(*) from (select value_set_version_id,concept_id from terminology.value_set_members group by 1,2 having count(*)>1) x) miembro_dup;
\echo == value sets allergy-* con miembros
select vs.internal_code, count(m.id) from terminology.value_sets vs join terminology.value_set_versions v on v.value_set_id=vs.id left join terminology.value_set_members m on m.value_set_version_id=v.id where vs.internal_code like 'allergy-%' group by 1 order by 2 desc;
\echo == designaciones de conceptos allergy-*: total y en castellano (concepto de idioma 'terminology:language:es')
select count(*) total, count(*) filter (where d.language_concept_id = (select id from terminology.catalog_concepts where code like '%language:es' or code='ES' limit 1)) es_por_codigo from terminology.concept_designations d join terminology.catalog_concepts c on c.id=d.concept_id join terminology.code_system_versions v on v.id=c.code_system_version_id join terminology.code_systems cs on cs.id=v.code_system_id where cs.internal_code like 'allergy-%';
select count(distinct d.concept_id) conceptos_con_es from terminology.concept_designations d where d.language_concept_id = (select id from terminology.catalog_concepts where code like '%language:es' or code='ES' limit 1);
