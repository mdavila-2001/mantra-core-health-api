// Siembra la operación de una farmacia ya registrada y VERIFICADA (e2e 2026-10-11).
// Uso: node scripts/seed-farmacia-e2e.mjs <codigo-del-tenant>
// Crea, por la API como administrador (BOOTSTRAP_ADMIN_*): la práctica y un sitio por
// sucursal con coordenadas (dirección por SQL), la sede dispensadora, la ubicación de
// inventario, la lista de precios PUBLICA en Bs con un precio por producto del catálogo
// y el stock (50 u. por producto y sede) por orden de compra + recepción de mercancía.
// Es la parte que el portal todavía no puede hacer sola (P47: precio y stock del producto).
// Idempotente por paso: reutiliza lo que ya existe.
import {execSync} from 'node:child_process';
const [tenantCode]=process.argv.slice(2);
const sql=q=>execSync(`docker exec -i mantra-redesa-postgres-1 psql -U mantra -d mantra_redesa_health -tAF'|' -c "${q.replace(/"/g,'\\"')}"`).toString().trim();
const API='http://localhost:3000';
const tl=await (await fetch(API+'/iam/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:'admin@redesa.test',password:'S3cret-passw0rd'})})).json();
const T=tl.accessToken;
const tenantId=sql(`select id from directory.tenants where code='${tenantCode}'`);
const pharmacyId=sql(`select id from pharmacy.pharmacies where tenant_id='${tenantId}'`);
console.log({tenantId,pharmacyId});
const call=async(m,path,body)=>{const r=await fetch(API+path,{method:m,headers:{'content-type':'application/json',authorization:'Bearer '+T,'x-tenant-id':tenantId},body:body?JSON.stringify(body):undefined});const t=await r.text();let j;try{j=JSON.parse(t)}catch{j=t}if(r.status>=400){console.log('FAIL',m,path,r.status,t.slice(0,400));throw new Error('fail')}return j};
let practice={id:sql(`select id from practice.practices where tenant_id='${tenantId}' order by created_at limit 1`)};
if(!practice.id) practice=await call('POST','/practices',{tenantId,code:'PRAC-'+tenantCode,name:'Operación '+tenantCode});
console.log('practice',practice.id);
const branches=sql(`select id||'|'||code||'|'||name||'|'||coalesce(latitude::text,'')||'|'||coalesce(longitude::text,'') from directory.branches where tenant_id='${tenantId}' order by code`).split('\n').map(l=>l.split('|'));
const addrTpl=sql(`select owner_type_concept_id||'|'||use_concept_id||'|'||type_concept_id||'|'||country_concept_id from common.addresses where id='bd3e1000-9b65-4a89-8208-186332ae2a86'`).split('|');
const sites=[];
for(const [bid,code,name,lat,lng] of branches){
  if(!lat) continue;
  const exist=sql(`select s.id||'|'||l.id from pharmacy.pharmacy_sites s left join pharmacy_inventory.inventory_locations l on l.pharmacy_site_id=s.id where s.pharmacy_id='${pharmacyId}' and s.code='${code}'`);
  if(exist){const [si,li]=exist.split('|');sites.push({site:si,loc:li,name});continue;}
  const ps=await call('POST',`/practices/${practice.id}/sites`,{code,name,managingTenantId:tenantId,branchId:bid});
  const aid=crypto.randomUUID();
  sql(`insert into common.addresses(id,owner_type_concept_id,owner_id,use_concept_id,type_concept_id,lines,city,country_concept_id,latitude,longitude,created_at,updated_at,row_version) values ('${aid}','${addrTpl[0]}','${ps.id}','${addrTpl[1]}','${addrTpl[2]}','${name}','Santa Cruz de la Sierra','${addrTpl[3]}',${lat},${lng},now(),now(),1)`);
  sql(`update practice.practice_sites set address_id='${aid}' where id='${ps.id}'`);
  const site=await call('POST',`/pharmacies/${pharmacyId}/sites`,{practiceSiteId:ps.id,code,name,homeDeliveryAvailable:true,pickupAvailable:true});
  const loc=await call('POST',`/pharmacy/${site.id}/inventory-locations`,{code:'EST-A',name:'Estante A',controlledAccess:false});
  sites.push({site:site.id,loc:loc.id,name});
  console.log('site',name,site.id,loc.id);
}
let pl={id:sql(`select id from pharmacy.pharmacy_price_lists where pharmacy_id='${pharmacyId}' and code='PL-PUBLICA'`)};
if(!pl.id) pl=await call('POST',`/pharmacies/${pharmacyId}/price-lists`,{code:'PL-PUBLICA',priceListType:'PUBLIC',publicVisibility:true,currencyConceptId:'d2fe4f04-ea13-510a-9a10-dfee2302a98f'});
const prods=sql(`select id||'|'||product_code from pharmacy.pharmacy_products where pharmacy_id='${pharmacyId}' order by product_code`).split('\n').map(l=>l.split('|'));
const prices={'PAR-500-20':15,'IBU-400-10':12.5,'AMX-500-12':38,'OME-20-14':25.9,'LOR-10-10':18,'MET-850-30':32.4,'ENA-10-30':21,'INS-100-10':95,'SAL-100-200':45};
for(const [pid,code] of prods){ if(sql(`select 1 from pharmacy.pharmacy_product_prices where pharmacy_price_list_id='${pl.id}' and pharmacy_product_id='${pid}'`)) continue; await call('POST',`/pharmacies/${pharmacyId}/price-lists/${pl.id}/prices`,{pharmacyProductId:pid,unitAmount:prices[code]??10,patientAmount:prices[code]??10}); }
console.log('prices',prods.length);
let sup={id:sql(`select id from pharmacy_inventory.pharmacy_suppliers where pharmacy_id='${pharmacyId}' limit 1`)};
if(!sup.id) sup=await call('POST',`/pharmacy/${pharmacyId}/suppliers`,{supplierTenantId:tenantId,supplierCode:'SUP-PROPIO'});
for(const s of sites){
  if(sql(`select 1 from pharmacy_inventory.inventory_stock_positions where inventory_location_id='${s.loc}' limit 1`)) continue;
  const po=await call('POST',`/pharmacy/${pharmacyId}/purchase-orders`,{pharmacySiteId:s.site,pharmacySupplierId:sup.id,lines:prods.map(([pid])=>({pharmacyProductId:pid,orderedQuantity:50,unitCostAmount:5}))});
  const lines=(po.lineIds||[]).map(id=>({id}));
  console.log('po',po.id,JSON.stringify(po).slice(0,300));
  const gr=await call('POST',`/pharmacy/${pharmacyId}/goods-receipts`,{pharmacyPurchaseOrderId:po.id,pharmacySiteId:s.site,inventoryLocationId:s.loc,supplierDeliveryReference:'SEED-E2E',lines:prods.map(([pid],i)=>({pharmacyPurchaseOrderLineId:(lines[i]||{}).id,pharmacyProductId:pid,lotNumber:'L-2026-'+(i+1),receivedQuantity:50,acceptedQuantity:50,expiresAt:'2028-12-31'}))});
  console.log('gr',gr.id);
}
console.log(sql(`select count(*), sum(available_quantity) from pharmacy_inventory.inventory_stock_positions`));
