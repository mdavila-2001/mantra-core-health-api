"""Accesos reproducibles para personas sintéticas de AloVida Dev; sin PHI en stdout."""
import json, os, secrets, uuid, hashlib, re, unicodedata
from pathlib import Path
from datetime import datetime, timezone
from argon2 import PasswordHasher
from argon2.exceptions import VerificationError
from psycopg import sql
import load_seeds

cfg=load_seeds.load_config()
assert cfg['POSTGRES_DB']=='alovida_dev'
conn=load_seeds.connect_pg(cfg)
namespace=uuid.UUID('e806294e-2826-5b87-9bb3-5e744d0840ee')
def ident(key):return uuid.uuid5(namespace,'alovida-dev:persona:'+key)
now=datetime.now(timezone.utc)
concepts=dict(conn.execute("SELECT code,id FROM terminology.catalog_concepts WHERE code IN ('USER_ACTIVE','ACTIVE','PASSWORD','ARGON2ID','USER','PRACTITIONER','PATIENT','profiles:ACCOUNT_LINK_SELF','profiles:ACCOUNT_LINK_ACTIVE','profiles:ACCOUNT_LINK_VERIFIED','directory:ROLE_STAFF','directory:MEMBERSHIP_ACTIVE','directory:SCOPE_ALL_TENANT') AND id <> '8c1c5cee-89c6-584f-9593-8e295b5f939d'").fetchall())
tenant=conn.execute("SELECT id FROM directory.tenants WHERE code='DEFAULT'").fetchone()[0]
people=conn.execute('''SELECT p.id,p.display_name,(pp.profile_id IS NOT NULL) FROM profiles.persons p
 JOIN profiles.health_practitioner_profiles h ON h.profile_id=p.id
 LEFT JOIN profiles.patient_profiles pp ON pp.profile_id=p.id ORDER BY p.id''').fetchall()
assert len(people)==16 and sum(bool(p[2]) for p in people)==12
path=Path('/output/personas.json')
previous=json.loads(path.read_text()) if path.exists() else []
by_person={a['person_id']:a for a in previous}
password='12345678' # Contraseña solicitada expresamente para estos accesos Dev
hash_=PasswordHasher().hash(password)
source_path=load_seeds.GENERALES_DIR / '05_profiles.seeds.json'
source=json.loads(source_path.read_text())
seed_people={}
for section in ['boot','mock']:
 for row in source.get(section,{}).get('records',{}).get('persons',[]):
  seed_people.setdefault(row['id'],row)
source_contacts=json.loads((load_seeds.GENERALES_DIR/'02_common.seeds.json').read_text())
seed_emails={}
for section in ['boot','mock']:
 for row in source_contacts.get(section,{}).get('records',{}).get('contact_points',[]):
  value=row.get('value','')
  if re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+",value):
   seed_emails.setdefault(row['owner_id'],value.lower())
addresses={}; supplement=[]
for pid,display,is_patient in people:
 key=str(pid)
 assert key in seed_people and seed_people[key]['display_name']==display
 parts=display.split()
 # El paquete sólo trae display_name: completar la separación de nombres/apellidos.
 single_surname={'Ana Lucía Flores':'Flores','Jorge Andrés Rivero':'Rivero','Luis Fernando Rojas':'Rojas'}
 first_name=parts[0]; paternal_surname=single_surname.get(display,parts[1])
 normalize=lambda text: re.sub(r'[^a-z0-9]','',unicodedata.normalize('NFKD',text).encode('ascii','ignore').decode().lower())
 email=normalize(first_name)+'.'+normalize(paternal_surname)+'@mail.com'
 assert email not in addresses.values(), 'Colisión de correo: requiere complemento explícito'
 addresses[key]=email
 supplement.append({'person_id':key,'display_name':display,'email':email,'email_origin':'completed_from_seed_name_user_format','first_name':first_name,'paternal_surname':paternal_surname,'roles':['USER','PRACTITIONER']+(['PATIENT'] if is_patient else [])})
contact_email=uuid.uuid5(uuid.UUID('3f2b6c14-9d5e-5a41-b7c2-0a1e9f4d8b60'),'common:contact-system:email')
assert conn.execute('SELECT code FROM terminology.catalog_concepts WHERE id=%s',(contact_email,)).fetchone()[0]=='EMAIL'
contact_work=conn.execute("SELECT id FROM terminology.catalog_concepts WHERE code='WORK'").fetchone()[0]
owner_person=conn.execute("SELECT id FROM terminology.catalog_concepts WHERE code='OWNER_PERSON'").fetchone()[0]
counts={}; accounts=[]; changed={'login_email':0,'display_name':0,'password':0,'contact_email':0}
def insert(schema,table,fields):
 q=sql.SQL('INSERT INTO {}.{} ({}) VALUES ({}) ON CONFLICT (id) DO NOTHING').format(sql.Identifier(schema),sql.Identifier(table),sql.SQL(',').join(map(sql.Identifier,fields)),sql.SQL(',').join(sql.Placeholder() for _ in fields))
 n=conn.execute(q,list(fields.values())).rowcount
 counts[schema+'.'+table]=counts.get(schema+'.'+table,0)+n
with conn.transaction():
 for i,(pid,display,is_patient) in enumerate(people,1):
  key=str(pid); seed_user=conn.execute('SELECT id FROM iam.users WHERE display_name=%s ORDER BY created_at,id LIMIT 1',(display,)).fetchone(); uid=seed_user[0] if seed_user else ident(key+':user'); email=addresses[key]
  assert not conn.execute('SELECT id FROM iam.authentication_credentials WHERE external_subject=%s AND id<>%s',(email,ident(key+':credential'))).fetchone()
  roles=['USER','PRACTITIONER']+(['PATIENT'] if is_patient else [])
  common={'created_at':now,'updated_at':now,'row_version':1}
  insert('iam','users',{'id':uid,'status_concept_id':concepts['USER_ACTIVE'],'display_name':display,'time_zone':'America/La_Paz','email_verified':True,'phone_verified':False,**common})
  insert('iam','authentication_credentials',{'id':ident(key+':credential'),'user_id':uid,'method_concept_id':concepts['PASSWORD'],'external_subject':email,'secret_hash':hash_,'hash_algorithm_concept_id':concepts['ARGON2ID'],'state_concept_id':concepts['ACTIVE'],**common})
  changed['login_email']+=conn.execute('UPDATE iam.authentication_credentials SET external_subject=%s,updated_at=%s,row_version=row_version+1 WHERE id=%s AND external_subject IS DISTINCT FROM %s',(email,now,ident(key+':credential'),email)).rowcount
  persisted=conn.execute('SELECT secret_hash FROM iam.authentication_credentials WHERE id=%s',(ident(key+':credential'),)).fetchone()[0]
  try:PasswordHasher().verify(persisted,password)
  except VerificationError:
   changed['password']+=conn.execute('UPDATE iam.authentication_credentials SET secret_hash=%s,updated_at=%s,row_version=row_version+1 WHERE id=%s',(hash_,now,ident(key+':credential'))).rowcount
  changed['display_name']+=conn.execute('UPDATE iam.users SET display_name=%s,updated_at=%s,row_version=row_version+1 WHERE id=%s AND display_name IS DISTINCT FROM %s',(display,now,uid,display)).rowcount
  insert('common','contact_points',{'id':ident(key+':email-contact'),'owner_type_concept_id':owner_person,'owner_id':pid,'system_concept_id':contact_email,'value':email,'use_concept_id':contact_work,'rank':1,'verified':False,'valid_from':now,**common})
  changed['contact_email']+=conn.execute('UPDATE common.contact_points SET value=%s,verified=false,updated_at=%s,row_version=row_version+1 WHERE id=%s AND value IS DISTINCT FROM %s',(email,now,ident(key+':email-contact'),email)).rowcount
  for role in roles:
   insert('iam','user_global_roles',{'id':ident(key+':role:'+role),'user_id':uid,'role_concept_id':concepts[role],'state_concept_id':concepts['ACTIVE'],**common})
  insert('profiles','person_account_links',{'id':ident(key+':link'),'person_id':pid,'user_id':uid,'link_type_concept_id':concepts['profiles:ACCOUNT_LINK_SELF'],'verification_status_concept_id':concepts['profiles:ACCOUNT_LINK_VERIFIED'],'status_concept_id':concepts['profiles:ACCOUNT_LINK_ACTIVE'],'valid_from':now,**common})
  insert('directory','tenant_memberships',{'id':ident(key+':membership'),'user_id':uid,'tenant_id':tenant,'tenant_role_concept_id':concepts['directory:ROLE_STAFF'],'status_concept_id':concepts['directory:MEMBERSHIP_ACTIVE'],'access_scope_concept_id':concepts['directory:SCOPE_ALL_TENANT'],'start_date':now.date(),**common})
  accounts.append({'display_name':display,'email':email,'password':password,'user_id':str(uid),'person_id':key,'roles':roles,'tenant_id':str(tenant)})
 # Verificar hashes persistidos, también en repeticiones: no rotar contraseñas.
 for a in accounts:
  stored=conn.execute('SELECT secret_hash FROM iam.authentication_credentials WHERE user_id=%s AND external_subject=%s',(a['user_id'],a['email'])).fetchone()[0]
  assert PasswordHasher().verify(stored,a['password'])
conn.commit()
fd=os.open(path,os.O_WRONLY|os.O_CREAT|os.O_TRUNC,0o600)
with os.fdopen(fd,'w') as f:json.dump(accounts,f,ensure_ascii=False,indent=2)
overlay=Path('/output/accesos-perfiles.seeds.json')
fd=os.open(overlay,os.O_WRONLY|os.O_CREAT|os.O_TRUNC,0o600)
with os.fdopen(fd,'w') as f:json.dump({'source':'modelo/seedsGenerales/modules/05_profiles.seeds.json','sha256':hashlib.sha256(source_path.read_bytes()).hexdigest(),'records':supplement},f,ensure_ascii=False,indent=2)
print('Actualizados:',json.dumps(changed,sort_keys=True))
print('Cuentas:',len(accounts),'con perfil paciente:',sum('PATIENT' in a['roles'] for a in accounts))
print('Insertados:',json.dumps(counts,sort_keys=True))
conn.close()
