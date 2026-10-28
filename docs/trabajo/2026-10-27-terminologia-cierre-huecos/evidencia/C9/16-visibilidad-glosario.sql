-- Reproduce las condiciones de CatalogConceptsRepository.searchGlossaryPage:
--   m.value_set_version_id = <versión del value set>, m.included = true, c.state_concept_id = TERM_ACTIVE
-- Total visible por value set (paraguas, categorías, etiquetas). TERM_ACTIVE = deterministicId('terminology:state:active').
\echo '--- visibles por value set (como los cuenta total de searchGlossaryPage)'
select vs.internal_code, count(*) as visibles
from terminology.value_sets vs
join terminology.value_set_versions v on v.value_set_id = vs.id
join terminology.value_set_members m on m.value_set_version_id = v.id and m.included = true
join terminology.catalog_concepts c on c.id = m.concept_id
join terminology.catalog_concepts st on st.code = 'TERM_ACTIVE' and c.state_concept_id = st.id
where vs.internal_code like 'glossary-%'
group by 1 order by (vs.internal_code <> 'glossary-all-terms'), vs.internal_code;
\echo '--- términos con estado activo vs total cargado'
select count(*) filter (where st.id is not null) activos, count(*) total
from terminology.catalog_concepts c left join terminology.catalog_concepts st on st.code='TERM_ACTIVE' and st.id=c.state_concept_id
where c.code_system_version_id in (select v.id from terminology.code_system_versions v join terminology.code_systems cs on cs.id=v.code_system_id where cs.internal_code<>'mantra-core');
