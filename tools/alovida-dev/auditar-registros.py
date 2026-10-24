"""Audita campos persistidos del complemento Dev sin imprimir datos personales."""
import json,uuid
from pathlib import Path
import load_seeds
cfg=load_seeds.load_config();assert cfg['POSTGRES_DB']=='alovida_dev'
c=load_seeds.connect_pg(cfg)
people=json.loads(Path('/output/personas.json').read_text())
for a in people:
 p=a['person_id']
 assert c.execute("SELECT count(*) FROM profiles.persons WHERE id=%s AND name<>'' AND last_name<>'' AND birth_date IS NOT NULL AND sex_at_birth_concept_id IS NOT NULL",(p,)).fetchone()[0]==1
 assert c.execute("SELECT count(*) FROM common.identifiers WHERE owner_id=%s AND value=%s AND issuer_country_concept_id IS NOT NULL AND issuer_administrative_area_concept_id IS NOT NULL",(p,a['national_id'])).fetchone()[0]>=1
 assert c.execute("SELECT count(*) FROM common.addresses WHERE owner_id=%s AND municipality_concept_id IS NOT NULL AND country_concept_id IS NOT NULL",(p,)).fetchone()[0]>=1
 assert c.execute("SELECT count(*) FROM common.contact_points WHERE owner_id=%s AND value=%s",(p,a['email'])).fetchone()[0]>=2
 assert c.execute("SELECT count(*) FROM common.contact_points WHERE owner_id=%s AND value=%s",(p,a['phone'])).fetchone()[0]>=4
 assert c.execute("SELECT count(*) FROM profiles.jurisdiction_authorizations WHERE practitioner_profile_id=%s AND license_number LIKE 'DEMO-%%' AND file_id IS NOT NULL",(p,)).fetchone()[0]==2
 assert c.execute("SELECT count(*) FROM profiles.professional_credentials WHERE practitioner_profile_id=%s AND number LIKE 'DEMO-%%' AND file_id IS NOT NULL",(p,)).fetchone()[0]>=1
rows=c.execute("SELECT tenant_id FROM insurance.insurance_carriers WHERE legal_name<>'' AND sigla<>'' AND length(sigla)<=20 AND address<>'' AND regulator_identifier<>'' AND jurisdiction_concept_id IS NOT NULL AND support_email<>'' AND call_center_phone<>''").fetchall();assert len(rows)==25
for (tenant,) in rows:
 assert c.execute("SELECT count(*) FROM directory.tenant_affiliation_documents WHERE tenant_id=%s AND document_number LIKE 'DEMO-%%' AND file_id IS NOT NULL",(tenant,)).fetchone()[0]==6
 assert c.execute("SELECT count(*) FROM directory.tenant_legal_representatives WHERE tenant_id=%s",(tenant,)).fetchone()[0]==4
 assert c.execute("SELECT count(*) FROM directory.tenant_legal_representatives WHERE tenant_id=%s AND is_primary=true AND ci_identifier_id IS NOT NULL AND power_of_attorney_document_id IS NOT NULL",(tenant,)).fetchone()[0]==1
accounts=json.loads(Path('/output/todos-usuarios.json').read_text())
assert c.execute('SELECT count(*) FROM iam.users').fetchone()[0]==len(accounts)==68
for a in accounts:
 assert c.execute("SELECT count(*) FROM iam.users WHERE id=%s AND time_zone='America/La_Paz' AND residence_country_concept_id IS NOT NULL AND privacy_accepted_at IS NOT NULL AND privacy_policy_version IS NOT NULL",(a['user_id'],)).fetchone()[0]==1
print('Campos persistidos: 16 personas, 32 licencias, 16 títulos, 25 aseguradoras, 150 documentos, 100 contactos institucionales y 68 usuarios: OK')
c.close()
