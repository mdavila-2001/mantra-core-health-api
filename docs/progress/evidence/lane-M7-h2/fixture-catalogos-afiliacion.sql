-- Fixture LOCAL para el Postgres efímero legion-h2-pg. NO va al repo de la API como seed:
-- estos value sets salen de los seeds del modelo (gen_seeds.py), que esta base no aplica.
-- Se reproducen acá con los códigos que exige src/modules/directory/affiliation-documents.ts
-- y legal-representatives.ts, sólo para poder ejercitar el alta de organización de punta a punta.
DO $$
DECLARE
  csv uuid := (SELECT code_system_version_id FROM terminology.catalog_concepts LIMIT 1);
  sets text[][] := ARRAY[
    ['VS_AFFILIATION_DOCUMENT_TYPE', 'ESCRITURA_CONSTITUCION,NIT_EXHIBICION,MATRICULA_SEPREC,LICENCIA_FUNCIONAMIENTO,CERTIFICADO_SEDES,PODER_REPRESENTANTE_LEGAL'],
    ['VS_ISSUING_AUTHORITY', 'NOTARIA,SIAT,SEPREC,GOBIERNO_MUNICIPAL,SEDES,OTRO'],
    ['VS_AFFILIATION_DOCUMENT_VERIFICATION_STATUS', 'PENDIENTE'],
    ['VS_LEGAL_REPRESENTATIVE_ROLE', 'REPRESENTANTE_LEGAL,GERENTE_GENERAL,GERENTE_COMERCIAL,GERENTE_MARKETING']
  ];
  s text[]; c text; vs uuid; vv uuid; cid uuid; n int;
BEGIN
  FOREACH s SLICE 1 IN ARRAY sets LOOP
    vs := gen_random_uuid(); vv := gen_random_uuid(); n := 0;
    INSERT INTO terminology.value_sets (id, internal_code, name, canonical_url, created_at, updated_at)
      VALUES (vs, s[1], s[1], 'urn:legion-h2:' || s[1], now(), now());
    INSERT INTO terminology.value_set_versions (id, value_set_id, version, is_default, created_at, updated_at)
      VALUES (vv, vs, '1', true, now(), now());
    FOREACH c IN ARRAY string_to_array(s[2], ',') LOOP
      SELECT id INTO cid FROM terminology.catalog_concepts WHERE code_system_version_id = csv AND code = c;
      IF cid IS NULL THEN
        cid := gen_random_uuid();
        INSERT INTO terminology.catalog_concepts (id, code_system_version_id, code, display, created_at, updated_at)
          VALUES (cid, csv, c, c, now(), now());
      END IF;
      n := n + 1;
      INSERT INTO terminology.value_set_members (id, value_set_version_id, concept_id, included, ordinal, created_at, updated_at)
        VALUES (gen_random_uuid(), vv, cid, true, n, now(), now());
    END LOOP;
  END LOOP;
END $$;
