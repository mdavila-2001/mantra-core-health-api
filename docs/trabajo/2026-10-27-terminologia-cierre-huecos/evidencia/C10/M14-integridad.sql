\pset format aligned
select 'conceptos por code system' k, cs.internal_code, count(*) from terminology.catalog_concepts c join terminology.code_system_versions v on v.id=c.code_system_version_id join terminology.code_systems cs on cs.id=v.code_system_id where cs.internal_code in ('emdn','fda-product-code') group by cs.internal_code;
select 'duplicados (code system, code)' k, count(*) from (select v.code_system_id, c.code from terminology.catalog_concepts c join terminology.code_system_versions v on v.id=c.code_system_version_id group by 1,2 having count(*)>1) x;
select 'conceptos sin code/display' k, count(*) from terminology.catalog_concepts where code is null or code='' or display is null or display='';
select 'designaciones huérfanas' k, count(*) from terminology.concept_designations d left join terminology.catalog_concepts c on c.id=d.concept_id where c.id is null;
select 'propiedades huérfanas' k, count(*) from terminology.concept_properties d left join terminology.catalog_concepts c on c.id=d.concept_id where c.id is null;
select 'relaciones huérfanas' k, count(*) from terminology.concept_relationships r left join terminology.catalog_concepts a on a.id=r.source_concept_id left join terminology.catalog_concepts b on b.id=r.target_concept_id where a.id is null or b.id is null;
select 'miembros value set huérfanos' k, count(*) from terminology.value_set_members m left join terminology.catalog_concepts c on c.id=m.concept_id where c.id is null;
select 'sin procedencia (dx_device_type_provenance)' k, count(*) from terminology.catalog_concepts c join terminology.code_system_versions v on v.id=c.code_system_version_id join terminology.code_systems cs on cs.id=v.code_system_id where cs.internal_code in ('emdn','fda-product-code') and not exists (select 1 from terminology.concept_properties p where p.concept_id=c.id and p.property_code='dx_device_type_provenance');
select 'code systems GMDN/pt/ja/in cargados (debe ser 0)' k, count(*) from terminology.code_systems where internal_code in ('gmdn','gmdn-pt','jmdn','br:anvisa-nome-tecnico','in:cdsco-device-name');
select 'concept_maps (debe ser 0: todo cruce era con GMDN)' k, count(*) from terminology.concept_maps;
select 'lotes de importación' k, count(*) from terminology.catalog_import_batches;
select 'fuentes con licencia' k, code, left(license,90) from terminology.terminology_sources where code in ('EC_EMDN','FDA_PRODUCT_CLASSIFICATION');
