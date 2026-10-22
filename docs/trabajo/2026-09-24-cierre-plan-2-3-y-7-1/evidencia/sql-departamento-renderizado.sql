SELECT 'CH' AS depto, count(*) AS sujetos FROM (
SELECT DISTINCT a.owner_id FROM common.addresses a
              WHERE (a.valid_to IS NULL OR a.valid_to >= CURRENT_DATE)
                AND (a.administrative_area_concept_id = '03433472-424c-5c7e-8ab4-16b25baa1c07'
                     OR a.municipality_concept_id IN (
                          SELECT c.id FROM terminology.catalog_concepts c
                           WHERE c.code LIKE ANY (ARRAY['CH-%', 'geo:bo:municipality:01%'])))
              LIMIT 5000) s;
SELECT 'LP' AS depto, count(*) AS sujetos FROM (
SELECT DISTINCT a.owner_id FROM common.addresses a
              WHERE (a.valid_to IS NULL OR a.valid_to >= CURRENT_DATE)
                AND (a.administrative_area_concept_id = 'e783b585-feb6-5b66-9123-c2e92b5489c7'
                     OR a.municipality_concept_id IN (
                          SELECT c.id FROM terminology.catalog_concepts c
                           WHERE c.code LIKE ANY (ARRAY['LP-%', 'geo:bo:municipality:02%'])))
              LIMIT 5000) s;
SELECT 'SC' AS depto, count(*) AS sujetos FROM (
SELECT DISTINCT a.owner_id FROM common.addresses a
              WHERE (a.valid_to IS NULL OR a.valid_to >= CURRENT_DATE)
                AND (a.administrative_area_concept_id = '16fe92e8-bec7-577d-9e63-4a0d8ff3b0e4'
                     OR a.municipality_concept_id IN (
                          SELECT c.id FROM terminology.catalog_concepts c
                           WHERE c.code LIKE ANY (ARRAY['SC-%', 'geo:bo:municipality:07%'])))
              LIMIT 5000) s;
