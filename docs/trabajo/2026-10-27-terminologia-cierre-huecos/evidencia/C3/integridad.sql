\echo '== conceptos por code system (versión)'
select cs.internal_code, csv.version, count(*) concepts from terminology.catalog_concepts cc join terminology.code_system_versions csv on csv.id=cc.code_system_version_id join terminology.code_systems cs on cs.id=csv.code_system_id group by 1,2 order by 1,2;
\echo '== (code system, code) presentes en 2 versiones: hallazgo, no error de modelo (ver REPORTE-C3 §Decisiones)'
select cs.internal_code, cc.code, count(*) from terminology.catalog_concepts cc join terminology.code_system_versions csv on csv.id=cc.code_system_version_id join terminology.code_systems cs on cs.id=csv.code_system_id group by 1,2 having count(*)>1 limit 10;
\echo '== duplicados por (versión, code) (esperado 0)'
select count(*) from (select code_system_version_id, code from terminology.catalog_concepts group by 1,2 having count(*)>1) t;
\echo '== conceptos con code o display nulo/vacío (esperado 0)'
select count(*) from terminology.catalog_concepts where code is null or code='' or display is null or display='';
\echo '== huérfanos: propiedades sin concepto, designaciones sin concepto, miembros sin concepto/version (esperado 0)'
select (select count(*) from terminology.concept_properties p left join terminology.catalog_concepts c on c.id=p.concept_id where c.id is null) props_huerfanas,
       (select count(*) from terminology.concept_designations d left join terminology.catalog_concepts c on c.id=d.concept_id where c.id is null) desig_huerfanas,
       (select count(*) from terminology.value_set_members m left join terminology.catalog_concepts c on c.id=m.concept_id where c.id is null) miembros_huerfanos,
       (select count(*) from terminology.value_set_members m left join terminology.value_set_versions v on v.id=m.value_set_version_id where v.id is null) miembros_sin_version,
       (select count(*) from terminology.catalog_concepts c left join terminology.code_system_versions v on v.id=c.code_system_version_id where v.id is null) conceptos_sin_version;
\echo '== propiedades con valor nulo (esperado 0)'
select count(*) from terminology.concept_properties where value_json is null;
\echo '== icd10pcs-cms: códigos de FY2026 (lab-tests) que existen en FY2027 (procedures) con el mismo display'
with x as (select cc.code, csv.version, cc.display from terminology.catalog_concepts cc join terminology.code_system_versions csv on csv.id=cc.code_system_version_id join terminology.code_systems cs on cs.id=csv.code_system_id where cs.internal_code='icd10pcs-cms')
select count(*) filter (where a.display=b.display) mismo_display, count(*) filter (where a.display<>b.display) distinto_display, count(*) total from x a join x b on a.code=b.code and a.version='ICD-10-PCS FY2026' and b.version='ICD-10-PCS FY2027';
