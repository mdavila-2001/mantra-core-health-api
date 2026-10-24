"""Inventario exhaustivo de IAM Dev: activa acceso, conserva UUID/origen y publica lista privada."""
import json,uuid,re,unicodedata,os
from pathlib import Path
from datetime import datetime,timezone,date
from argon2 import PasswordHasher
from argon2.exceptions import VerificationError
from psycopg import sql
import load_seeds
cfg=load_seeds.load_config();assert cfg['POSTGRES_DB']=='alovida_dev';conn=load_seeds.connect_pg(cfg);now=datetime.now(timezone.utc)
ns=uuid.UUID('e806294e-2826-5b87-9bb3-5e744d0840ee');core=uuid.UUID('3f2b6c14-9d5e-5a41-b7c2-0a1e9f4d8b60');ph=PasswordHasher();password='12345678';hashed=ph.hash(password);counts={}
def uid(key):return uuid.uuid5(ns,'alovida-dev:acceso-total:'+key)
def c(key):
 value=uuid.uuid5(core,key);assert conn.execute('SELECT 1 FROM terminology.catalog_concepts WHERE id=%s',(value,)).fetchone(),key
 return value
def insert(schema,table,data):
 fields={**{'created_at':now,'updated_at':now,'row_version':1},**data}
 query=sql.SQL('INSERT INTO {}.{} ({}) VALUES ({}) ON CONFLICT(id) DO NOTHING').format(sql.Identifier(schema),sql.Identifier(table),sql.SQL(',').join(map(sql.Identifier,fields)),sql.SQL(',').join(sql.Placeholder() for _ in fields))
 n=conn.execute(query,list(fields.values())).rowcount;counts[schema+'.'+table]=counts.get(schema+'.'+table,0)+n

def matches(hash_,pw):
 try:
  parts=hash_.split('$');params=dict(x.split('=') for x in parts[3].split(','));parts[3]=','.join(k+'='+params[k] for k in ['m','t','p']);return ph.verify('$'.join(parts),pw)
 except (VerificationError,ValueError,KeyError,IndexError,AttributeError):return False
people=json.loads(Path('/output/personas.json').read_text());by_name={a['display_name']:a for a in people};by_user={a['user_id']:a for a in people}
insurers=json.loads(Path('/output/aseguradoras.json').read_text());by_insurer={a['email'].lower():a for a in insurers}
seed_iam=json.loads((load_seeds.GENERALES_DIR/'01_iam.seeds.json').read_text());source_ids={r['id'] for section in ['boot','mock'] for r in seed_iam[section]['records']['users']}
def slug(name):return re.sub(r'[^a-z0-9]+','.',unicodedata.normalize('NFKD',name).encode('ascii','ignore').decode().lower()).strip('.')
def canonical_profile_link(user,a):
 insert('profiles','person_account_links',{'id':uid('link:'+str(user)),'person_id':uuid.UUID(a['person_id']),'user_id':user,'link_type_concept_id':c('profiles:ACCOUNT_LINK_SELF'),'verification_status_concept_id':c('profiles:ACCOUNT_LINK_VERIFIED'),'status_concept_id':c('profiles:ACCOUNT_LINK_ACTIVE'),'valid_from':date(2026,10,2)})
default_tenant=conn.execute("SELECT id FROM directory.tenants WHERE code='DEFAULT'").fetchone()[0];inventory=[];seen=set();updated=0
users=conn.execute('SELECT id,display_name FROM iam.users ORDER BY display_name,id').fetchall()
with conn.transaction():
 for user,name in users:
  id_=str(user);variant=re.fullmatch(r'(.+) \(caso (\d+)\)',name);variant_person=by_name.get(variant.group(1)) if variant else None;credential=conn.execute('SELECT id,external_subject,secret_hash FROM iam.authentication_credentials WHERE user_id=%s AND method_concept_id=%s ORDER BY created_at,id LIMIT 1',(user,c('iam:cred-method:password'))).fetchone();person=by_user.get(id_) or variant_person;category='cuenta técnica del seed';tenant=default_tenant;roles=['USER']
  if credential:
   credential_id,email,current=credential;email=email.lower()
   if email in by_insurer:
    category='aseguradora';tenant=uuid.UUID(by_insurer[email]['tenant_id']);role_label='USER; administrador de su aseguradora'
   elif person:
    category='persona del seed' if id_ in by_user else 'variante de cuenta del seed';tenant=uuid.UUID(person['tenant_id']);roles=person['roles'];role_label=', '.join(roles)
   elif email==cfg['BOOTSTRAP_ADMIN_EMAIL'].lower():
    category='administrador';roles=['SUPERADMIN','SECURITY_ADMIN'];role_label=', '.join(roles)
   else:
    expected=slug(name)+('@mail.com' if id_ in source_ids else '.api@mail.com');assert email==expected,'Credencial no clasificada: revisar inventario';role_label='USER'
   conn.execute('UPDATE iam.authentication_credentials SET external_subject=%s,state_concept_id=%s,hash_algorithm_concept_id=%s WHERE id=%s',(email,c('state:active'),c('iam:hash-algo:argon2id'),credential_id))
   if not matches(current,password):conn.execute('UPDATE iam.authentication_credentials SET secret_hash=%s WHERE id=%s',(hashed,credential_id));updated+=1
  else:
   match=re.fullmatch(r'(.+) \(caso (\d+)\)',name)
   if match and match.group(1) in by_name:
    person=by_name[match.group(1)];email=person['email'].replace('@',f'.caso{match.group(2)}@');roles=person['roles'];tenant=uuid.UUID(person['tenant_id']);category='variante de cuenta del seed';canonical_profile_link(user,person)
   else:
    email=slug(name)+('@mail.com' if id_ in source_ids else '.api@mail.com')
   role_label=', '.join(roles);credential_id=uid('credential:'+id_)
   insert('iam','authentication_credentials',{'id':credential_id,'user_id':user,'external_subject':email,'method_concept_id':c('iam:cred-method:password'),'secret_hash':hashed,'hash_algorithm_concept_id':c('iam:hash-algo:argon2id'),'state_concept_id':c('state:active')})
  assert email not in seen;seen.add(email)
  conn.execute('UPDATE iam.users SET status_concept_id=%s,mfa_status_concept_id=%s,time_zone=%s,must_change_password=false,privacy_accepted_at=coalesce(privacy_accepted_at,%s),privacy_policy_version=coalesce(privacy_policy_version,%s),residence_country_concept_id=%s WHERE id=%s',(c('iam:user-status:active'),c('iam:mfa-status:disabled'),'America/La_Paz',now,'dev-seed-2026-10-02',c('common:country:bo'),user))
  for role in roles:
   key={'USER':'user','PATIENT':'patient','PRACTITIONER':'practitioner','SUPERADMIN':'superadmin','SECURITY_ADMIN':'security-admin'}[role]
   if not conn.execute('SELECT 1 FROM iam.user_global_roles WHERE user_id=%s AND role_concept_id=%s AND state_concept_id=%s',(user,c('iam:role:'+key),c('state:active'))).fetchone():
    insert('iam','user_global_roles',{'id':uid('role:'+id_+':'+role),'user_id':user,'role_concept_id':c('iam:role:'+key),'state_concept_id':c('state:active')})
  if not conn.execute('SELECT 1 FROM directory.tenant_memberships WHERE user_id=%s AND tenant_id=%s AND status_concept_id=%s',(user,tenant,c('directory:MEMBERSHIP_ACTIVE'))).fetchone():
   insert('directory','tenant_memberships',{'id':uid('membership:'+id_),'user_id':user,'tenant_id':tenant,'tenant_role_concept_id':c('directory:ROLE_STAFF'),'status_concept_id':c('directory:MEMBERSHIP_ACTIVE'),'access_scope_concept_id':c('directory:SCOPE_ALL_TENANT'),'start_date':date(2026,10,2)})
  aliases=[]
  if id_ in by_user and 'PATIENT' in roles:
   national=person['national_id'];alias_id=uid('national-credential:'+id_)
   insert('iam','authentication_credentials',{'id':alias_id,'user_id':user,'external_subject':national,'method_concept_id':c('iam:cred-method:password'),'secret_hash':hashed,'hash_algorithm_concept_id':c('iam:hash-algo:argon2id'),'state_concept_id':c('state:active')});aliases.append({'nationalId':national})
  inventory.append({'name':name,'email':email,'password':password,'roles':roles,'role_label':role_label,'user_id':id_,'category':category,'tenant_id':str(tenant),'person_id':person['person_id'] if person else None,'profile_display_name':person['display_name'] if person else None,'profile_email':person['email'] if person else None,'aliases':aliases})
 # Cobertura, no existen cuentas sin PASSWORD activo ni contraseñas ocultas desconocidas.
 assert len(inventory)==conn.execute('SELECT count(*) FROM iam.users').fetchone()[0]
 for a in inventory:
  stored=conn.execute('SELECT secret_hash FROM iam.authentication_credentials WHERE user_id=%s AND external_subject=%s AND method_concept_id=%s',(a['user_id'],a['email'],c('iam:cred-method:password'))).fetchone()[0];assert matches(stored,a['password'])
 assert conn.execute('SELECT count(*) FROM iam.users u WHERE NOT EXISTS(SELECT 1 FROM iam.authentication_credentials a WHERE a.user_id=u.id AND a.method_concept_id=%s AND a.state_concept_id=%s)',(c('iam:cred-method:password'),c('state:active'))).fetchone()[0]==0
conn.commit()
for a in insurers:a['email']=a['email'].lower();a['password']=password
for filename,value in [('todos-usuarios.json',inventory),('aseguradoras.json',insurers)]:
 path=Path('/output')/filename;fd=os.open(path,os.O_WRONLY|os.O_CREAT|os.O_TRUNC,0o600)
 with os.fdopen(fd,'w') as f:json.dump(value,f,ensure_ascii=False,indent=2)
print('Usuarios IAM:',len(inventory),'sin acceso válido: 0','contraseñas corregidas:',updated)
print('Categorías:',json.dumps({key:sum(a['category']==key for a in inventory) for key in sorted({a['category'] for a in inventory})}))
print('Insertados:',json.dumps(counts,sort_keys=True));conn.close()
