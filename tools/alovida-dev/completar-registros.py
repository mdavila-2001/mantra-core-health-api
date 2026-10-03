"""Completa registros Dev desde seeds; contenido agregado siempre marcado como demostración."""
import json,uuid,hashlib,os,sys
from pathlib import Path
from datetime import datetime,timezone,date
from io import BytesIO
from PIL import Image,ImageDraw
from psycopg import sql
import load_seeds
sys.path.insert(0,'/jobs')
import importlib.util
spec=importlib.util.spec_from_file_location('imagenes','/jobs/imagenes-demo.py');images=importlib.util.module_from_spec(spec);spec.loader.exec_module(images)
cfg=load_seeds.load_config();assert cfg['POSTGRES_DB']=='alovida_dev'
conn=load_seeds.connect_pg(cfg);now=datetime.now(timezone.utc);ns=uuid.UUID('e806294e-2826-5b87-9bb3-5e744d0840ee');core=uuid.UUID('3f2b6c14-9d5e-5a41-b7c2-0a1e9f4d8b60')
def uid(key):return uuid.uuid5(ns,'alovida-dev:registro:'+key)
def c(key):
 id_=uuid.uuid5(core,key)
 assert conn.execute('SELECT 1 FROM terminology.catalog_concepts WHERE id=%s',(id_,)).fetchone(),key
 return id_
def code(value,vs=None):
 if vs:
  rows=conn.execute('''SELECT DISTINCT cc.id FROM terminology.value_sets s JOIN terminology.value_set_versions v ON v.value_set_id=s.id JOIN terminology.value_set_members m ON m.value_set_version_id=v.id JOIN terminology.catalog_concepts cc ON cc.id=m.concept_id WHERE upper(s.internal_code)=upper(%s) AND upper(cc.code)=upper(%s)''',(vs,value)).fetchall()
 else:rows=conn.execute('SELECT id FROM terminology.catalog_concepts WHERE code=%s',(value,)).fetchall()
 assert len(rows)==1,(value,vs,len(rows))
 return rows[0][0]
common={'created_at':now,'updated_at':now,'row_version':1};counts={}
def upsert(schema,table,fields,pk='id'):
 values={**common,**fields};columns=list(values)
 updates=[k for k in columns if k not in [pk,'created_at','updated_at','row_version']]
 query=sql.SQL('INSERT INTO {}.{} AS target ({}) VALUES ({}) ON CONFLICT ({}) DO UPDATE SET {}, updated_at=now(),row_version=target.row_version+1 WHERE ({}) IS DISTINCT FROM ({})').format(sql.Identifier(schema),sql.Identifier(table),sql.SQL(',').join(map(sql.Identifier,columns)),sql.SQL(',').join(sql.Placeholder() for _ in columns),sql.Identifier(pk),sql.SQL(',').join(sql.SQL('{}=EXCLUDED.{}').format(sql.Identifier(k),sql.Identifier(k)) for k in updates),sql.SQL(',').join(sql.SQL('target.{}').format(sql.Identifier(k)) for k in updates),sql.SQL(',').join(sql.SQL('EXCLUDED.{}').format(sql.Identifier(k)) for k in updates))
 n=conn.execute(query,list(values.values())).rowcount;counts[schema+'.'+table]=counts.get(schema+'.'+table,0)+n
 return fields[pk]
def parts(name):
 words=name.split();single={'Ana Lucía Flores','Luis Fernando Rojas','Jorge Andrés Rivero'}
 return {'name':words[0],'middle_name':words[1] if name in single else None,'last_name':words[-1] if name in single else words[1],'mother_last_name':None if name in single else ' '.join(words[2:]) or None,'display_name':name}
country=c('common:country:bo');department=code('geo:bo:department:LP');municipality=code('geo:bo:municipality:020101')
owner_person=c('common:owner-type:person');owner_tenant=c('common:owner-type:tenant');active=c('state:active')
# state:active debe coincidir con la definición real del backend.
cc=images.conceptos(conn);cc['IMAGE']=c('common:file-category:document')
root=Path('/tmp/imagenes-alovida');bucket=cfg['FILE_STORAGE_S3_BUCKET'];prefix=cfg.get('FILE_STORAGE_S3_PREFIX','uploads')
def pdf(tenant,label,key,owner_user=None):
 image=Image.new('RGB',(1100,700),'white');draw=ImageDraw.Draw(image)
 draw.text((50,65),'ALOVIDA DEV - DOCUMENTO DE DEMOSTRACION',fill='black',font=images.fuente(32))
 draw.text((50,145),'SIN VALIDEZ LEGAL - DATOS SINTETICOS',fill='red',font=images.fuente(28))
 draw.text((50,245),label[:70],fill='black',font=images.fuente(22))
 draw.text((50,300),key[:75],fill='black',font=images.fuente(18))
 out=BytesIO();image.save(out,format='PDF',creationDate='D:20261002000000Z',modDate='D:20261002000000Z');data=out.getvalue();sha=hashlib.sha256(data).hexdigest();p=root/sha[:2]/sha;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data)
 fileid=images.registrar(conn,cc,str(tenant),'demostracion-'+key+'.pdf',sha,len(data),bucket,prefix,'application/pdf')
 if owner_user:conn.execute('UPDATE common.files SET created_by_user_id=%s WHERE id=%s AND created_by_user_id IS DISTINCT FROM %s',(uuid.UUID(str(owner_user)),uuid.UUID(fileid),uuid.UUID(str(owner_user))))
 return fileid
def contact(person,kind,value,use='home',owner=None):
 return upsert('common','contact_points',{'id':uid(f'contact:{person}:{kind}:{use}'),'owner_type_concept_id':owner or owner_person,'owner_id':person,'system_concept_id':c('common:contact-system:'+kind),'value':value,'use_concept_id':c('common:contact-use:'+use),'rank':1,'verified':False,'valid_from':date(2026,10,2)})
def identifier(person,value):
 return upsert('common','identifiers',{'id':uid('ci:'+str(person)),'owner_type_concept_id':owner_person,'owner_id':person,'type_concept_id':c('common:id-type:national'),'use_concept_id':c('common:use:official'),'system':'urn:alovida:dev-seed:ci','value':value,'issuer_country_concept_id':country,'issuer_administrative_area_concept_id':department,'state_concept_id':active})
def address(person,key,owner=owner_person,lines='Domicilio de demostración AloVida Dev'):
 return upsert('common','addresses',{'id':uid('address:'+key),'owner_type_concept_id':owner,'owner_id':person,'use_concept_id':c('common:addr-use:home' if owner==owner_person else 'common:addr-use:work'),'type_concept_id':c('common:addr-type:postal'),'lines':lines,'city':'La Paz','administrative_area_concept_id':department,'municipality_concept_id':municipality,'country_concept_id':country,'latitude':'-16.4897','longitude':'-68.1193'})
accounts=json.loads(Path('/output/personas.json').read_text());patients=set(str(r[0]) for r in conn.execute('SELECT profile_id FROM profiles.patient_profiles').fetchall());payloads={'patients':[],'practitioners':[],'organizations':[]};manifest=[]
with conn.transaction():
 for i,a in enumerate(accounts,1):
  pid=uuid.UUID(a['person_id']);key=str(pid);name=a['display_name'];info=parts(name);national='9900'+f'{i:04d}';phone='+5917000'+f'{i:04d}'
  conn.execute('UPDATE profiles.persons SET name=%s,middle_name=%s,last_name=%s,mother_last_name=%s,sex_at_birth_concept_id=%s,person_status_concept_id=%s WHERE id=%s AND (name,middle_name,last_name,mother_last_name,sex_at_birth_concept_id,person_status_concept_id) IS DISTINCT FROM (%s,%s,%s,%s,%s,%s)',(info['name'],info['middle_name'],info['last_name'],info['mother_last_name'],c('profiles:BIRTH_SEX_UNKNOWN'),c('profiles:PERSON_ACTIVE'),pid,info['name'],info['middle_name'],info['last_name'],info['mother_last_name'],c('profiles:BIRTH_SEX_UNKNOWN'),c('profiles:PERSON_ACTIVE')))
  identifier(pid,national);address(pid,key)
  for kind,use in [('phone','home'),('mobile','home'),('mobile','work'),('phone','work')]:contact(pid,kind,phone,use)
  contact(pid,'email',a['email'],'home')
  title=conn.execute('SELECT professional_title FROM profiles.health_practitioner_profiles WHERE profile_id=%s',(pid,)).fetchone()[0]
  assert title
  birth=conn.execute('SELECT birth_date FROM profiles.persons WHERE id=%s',(pid,)).fetchone()[0];assert birth
  for typ in ['PRACTITIONER']+(['PATIENT'] if key in patients else []):
   upsert('profiles','person_profiles',{'id':uid('profile:'+key+':'+typ),'person_id':pid,'profile_type_concept_id':c('profiles:PROFILE_TYPE_'+typ),'status_concept_id':c('profiles:PROFILE_ACTIVE')})
  licenses=[]
  for label,jurisdiction in [('NACIONAL',c('profiles:JURISDICTION_NATIONAL')),('SEDES',c('profiles:JURISDICTION_SEDES_SANTA_CRUZ'))]:
   number='DEMO-'+label+'-'+f'{i:04d}';licenses.append(number)
   file=pdf(uuid.UUID(a['tenant_id']),label,key+'-'+label,a['user_id'])
   upsert('profiles','jurisdiction_authorizations',{'id':uid('license:'+key+':'+label),'practitioner_profile_id':pid,'jurisdiction_concept_id':jurisdiction,'license_number':number,'regulatory_authority':'Registro de demostración — sin habilitación legal','state_concept_id':c('profiles:AUTH_PENDING'),'valid_from':date(2026,10,2),'file_id':uuid.UUID(file)})
  degreefile=pdf(uuid.UUID(a['tenant_id']),'TITULO ACADEMICO',key+'-titulo',a['user_id'])
  upsert('profiles','professional_credentials',{'id':uid('degree:'+key),'practitioner_profile_id':pid,'credential_type_concept_id':c('profiles:CREDENTIAL_TYPE_DEGREE'),'number':'DEMO-TITULO-'+f'{i:04d}','issuing_institution_text':'Documento de demostración; institución no acreditada','issuing_country_concept_id':country,'issuing_city_text':'La Paz','issue_date':date(2020,1,1),'state_concept_id':c('profiles:CRED_PENDING'),'file_id':uuid.UUID(degreefile)})
  person={'name':info['name'],'lastName':info['last_name'],'middleName':info['middle_name'],'motherLastName':info['mother_last_name'],'email':a['email'],'password':'12345678','nationalId':national,'issuerAdministrativeAreaConceptId':str(department),'residenceMunicipalityConceptId':str(municipality),'birthDate':str(birth),'sexAtBirth':'UNKNOWN','phone':phone}
  person={k:v for k,v in person.items() if v is not None}
  payloads['practitioners'].append({**person,'personalEmail':a['email'],'mobilePhone':phone,'workEmail':a['email'],'workMobilePhone':phone,'workLandline':phone,'licenseNumber':licenses[0],'sedesLicenseNumber':licenses[1],'professionalTitle':title,'regulatoryAuthority':'Registro de demostración','licenseIssueDate':'2026-10-02','credentialNumber':'DEMO-TITULO-'+f'{i:04d}','credentials':[{'credentialTypeConceptId':str(c('profiles:CREDENTIAL_TYPE_DEGREE')),'number':'DEMO-TITULO-'+f'{i:04d}','fileId':degreefile}]})
  if key in patients:payloads['patients'].append(person)
  a['national_id']=national;a['profile_display_name']=name;a['phone']=phone
  manifest.append({'person_id':key,'completed_fields':['name_parts','nationalId','issuer','municipality','phone','licenses','credentials'],'origin':'synthetic_completion_of_model_seed'})
 carriers=conn.execute('SELECT id,tenant_id,carrier_code,legal_name,sigla,address,regulator_identifier FROM insurance.insurance_carriers ORDER BY carrier_code').fetchall()
 owners=json.loads(Path('/output/aseguradoras.json').read_text())
 doc_roles=[('constitutionFileId','ESCRITURA_CONSTITUCION','NOTARIA'),('taxIdentifierFileId','NIT_EXHIBICION','SIAT'),('commerceRegistryFileId','MATRICULA_SEPREC','SEPREC'),('operatingLicenseFileId','LICENCIA_FUNCIONAMIENTO','GOBIERNO_MUNICIPAL'),('healthAuthorityCertificateFileId','CERTIFICADO_SEDES','SEDES'),('powerOfAttorneyFileId','PODER_REPRESENTANTE_LEGAL','NOTARIA')]
 for i,(carrier,tenant,carrier_code,legal,sigla,street,regulator) in enumerate(carriers,1):
  owner=next(a for a in owners if a['carrier_code']==carrier_code);key=str(tenant);sigla=(sigla or ('DEMO'+str(i)))[:20].rstrip();street=street or 'Sede de demostración — La Paz';regulator=regulator or ('DEMO-REG-'+f'{i:04d}');phone='+5917001'+f'{i:04d}'
  conn.execute('UPDATE insurance.insurance_carriers SET sigla=%s,address=%s,regulator_identifier=%s,whatsapp_number=%s,call_center_phone=%s,support_email=%s,jurisdiction_concept_id=%s WHERE id=%s AND (sigla,address,regulator_identifier,whatsapp_number,call_center_phone,support_email,jurisdiction_concept_id) IS DISTINCT FROM (%s,%s,%s,%s,%s,%s,%s)',(sigla,street,regulator,phone,phone,owner['email'],department,carrier,sigla,street,regulator,phone,phone,owner['email'],department))
  conn.execute('UPDATE directory.tenants SET country_concept_id=%s,jurisdiction_concept_id=%s,time_zone=%s WHERE id=%s AND (country_concept_id,jurisdiction_concept_id,time_zone) IS DISTINCT FROM (%s,%s,%s)',(country,department,'America/La_Paz',tenant,country,department,'America/La_Paz'))
  address(tenant,key,owner_tenant,street);contact(tenant,'email',owner['email'],'work',owner_tenant);contact(tenant,'phone',phone,'work',owner_tenant)
  documents={};doc_ids={}
  for field,doctype,authority in doc_roles:
   owner_uid=conn.execute('SELECT user_id FROM iam.authentication_credentials WHERE lower(external_subject)=lower(%s) AND method_concept_id=%s',(owner['email'],c('iam:cred-method:password'))).fetchone()[0]
   file=pdf(tenant,doctype,key+'-'+doctype,owner_uid)
   docid=upsert('directory','tenant_affiliation_documents',{'id':uid('document:'+key+':'+doctype),'tenant_id':tenant,'document_type_concept_id':code(doctype,'VS_AFFILIATION_DOCUMENT_TYPE'),'issuing_authority_concept_id':code(authority,'VS_ISSUING_AUTHORITY'),'file_id':uuid.UUID(file),'document_number':'DEMO-'+str(i)+'-'+doctype,'registered_at':now.date(),'issued_at':date(2026,10,2),'valid_from':date(2026,10,2),'verification_status_concept_id':code('PENDIENTE','VS_AFFILIATION_DOCUMENT_VERIFICATION_STATUS'),'is_required_for_affiliation':True,'notes':'Documento sintético de demostración. Sin validez legal.','status_concept_id':active})
   documents[field]=file;doc_ids[field]=docid
  rep_payload={};executives={}
  for j,(role,field) in enumerate([('REPRESENTANTE_LEGAL',None),('GERENTE_GENERAL','generalManager'),('GERENTE_COMERCIAL','commercialManager'),('GERENTE_MARKETING','marketingManager')]):
   template=accounts[(i+j-1)%len(accounts)];rname=template['display_name'];rid=uid('representative:'+key+':'+role);linkid=uid('rep-link:'+key+':'+role)
   existing=conn.execute('SELECT r.id,r.person_id,p.display_name FROM directory.tenant_legal_representatives r JOIN profiles.persons p ON p.id=r.person_id WHERE r.tenant_id=%s AND '+('r.is_primary=true' if field is None else 'r.representative_role_concept_id=%s')+' LIMIT 1',(tenant,) if field is None else (tenant,code(role,'VS_LEGAL_REPRESENTATIVE_ROLE'))).fetchone()
   if existing:linkid,rid,rname=existing
   rparts=parts(rname);email=owner['email'] if field is None else f'{field.lower()}.{i}@mail.com';rphone=phone
   medical=next((a for a in accounts if a['person_id']==str(rid)),None)
   if medical:email=medical['email'];rphone=medical['phone']
   upsert('profiles','persons',{'id':rid,'person_status_concept_id':c('profiles:PERSON_ACTIVE'),**rparts})
   contact(rid,'email',email);contact(rid,'mobile',rphone)
   existing_ci=conn.execute('SELECT id,value FROM common.identifiers WHERE owner_id=%s AND type_concept_id=%s ORDER BY created_at,id LIMIT 1',(rid,c('common:id-type:national'))).fetchone() if field is None else None
   ci=existing_ci[0] if existing_ci else (identifier(rid,'9800'+f'{i:03d}'+str(j)) if field is None else None)
   upsert('directory','tenant_legal_representatives',{'id':linkid,'tenant_id':tenant,'person_id':rid,'representative_role_concept_id':code(role,'VS_LEGAL_REPRESENTATIVE_ROLE'),'ci_identifier_id':ci,'power_of_attorney_document_id':doc_ids['powerOfAttorneyFileId'] if field is None else None,'appointed_at':date(2026,10,2),'valid_from':date(2026,10,2),'is_primary':True if field is None else None,'status_concept_id':active})
   data={'fullName':rname,'email':email,'phone':rphone}
   if field is None:rep_payload={**data,'idNumber':existing_ci[1] if existing_ci else '9800'+f'{i:03d}'+str(j),'powerOfAttorneyFileId':documents['powerOfAttorneyFileId']}
   else:executives[field]=data
  payloads['organizations'].append({'organization':{'code':carrier_code,'legalName':legal,'tenantType':'PAYER','timeZone':'America/La_Paz','countryConceptId':str(country),'jurisdictionConceptId':str(department),'payer':{'carrierCode':carrier_code,'sigla':sigla,'address':street,'regulatorIdentifier':regulator,'jurisdictionConceptId':str(department),'latitude':-16.4897,'longitude':-68.1193},'legalDocuments':{k:v for k,v in documents.items() if k!='powerOfAttorneyFileId'},'legalRepresentative':rep_payload,'executives':executives},'owner':{'email':owner['email'],'password':'12345678','displayName':owner['display_name']}})
conn.commit()
for filename,data in [('personas.json',accounts),('registration-payloads.json',payloads),('registro-complemento.seeds.json',manifest)]:
 path=Path('/output')/filename;fd=os.open(path,os.O_WRONLY|os.O_CREAT|os.O_TRUNC,0o600)
 with os.fdopen(fd,'w') as f:json.dump(data,f,ensure_ascii=False,indent=2,default=str)
print('Campos de registro completados:',json.dumps({k:len(v) for k,v in payloads.items()}))
print('Registros insertados/actualizados:',json.dumps(counts,sort_keys=True))
conn.close()
