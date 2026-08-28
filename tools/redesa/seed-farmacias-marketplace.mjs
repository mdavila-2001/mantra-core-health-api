#!/usr/bin/env node
/**
 * Seed de la vitrina pública de medicamentos (marketplace de exhibición).
 *
 * ## Por qué existe
 *
 * `/buscar/medicamentos` salía vacía y era correcto que saliera vacía: un
 * medicamento **no es un perfil público**, y el esquema `pharmacy.*` —que sí es
 * su casa— estaba sin una sola fila. Este script lo llena con datos coherentes
 * para que la vitrina muestre algo cierto: farmacias con nombre y coordenadas
 * propias, productos sobre el vademécum real, precios públicos y stock.
 *
 * ## Qué NO reutiliza, y por qué
 *
 * Los perfiles públicos de farmacia que ya había vienen del seeder acumulativo
 * de la vitrina: **dos nombres repetidos veinticinco veces**, todos en la misma
 * esquina de su ciudad. Una vitrina con doce «Farmacia Vida Plena» idénticas no
 * se puede mirar. Este seeder crea los suyos, con nombres y puntos distintos, y
 * no toca los existentes.
 *
 * ## Idempotencia
 *
 * Todos los uuid se derivan por hash de una clave estable, así que volver a
 * correrlo no duplica nada: cada fila cae en su propio `ON CONFLICT DO NOTHING`.
 * Los precios y el stock sí se actualizan, que es lo único que se espera que
 * cambie entre corridas.
 *
 * ## Lo único que no crea
 *
 * `pharmacy.pharmacy_sites.practice_site_id` es NOT NULL y apunta al dominio de
 * práctica. En vez de inventar prácticas —escribir en otro dominio es lo que el
 * seeder de laboratorios se prohíbe a sí mismo—, reutiliza por SELECT las sedes
 * de práctica que ya existen. Si no hay ninguna, se detiene y lo dice.
 */
import { createHash } from 'node:crypto';
import 'dotenv/config';
import pg from 'pg';

const db = new pg.Client({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5433),
  user: process.env.DB_USER ?? 'mantra',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'mantra_redesa_health',
});

/* ── Conceptos ───────────────────────────────────────────────────────────── */

/** Códigos del catálogo que el seeder necesita resueltos a uuid. */
const CODIGOS = [
  'pharmacy:PHARMACY_TYPE_RETAIL',
  'pharmacy:OWNERSHIP_PRIVATE',
  'pharmacy:VERIFICATION_VERIFIED',
  'pharmacy:PHARMACY_ACTIVE',
  'pharmacy:SITE_TYPE_DISPENSING',
  'pharmacy:SITE_ACTIVE',
  'pharmacy:DISPENSING_MODE_ONSITE',
  'pharmacy:PRODUCT_ACTIVE',
  'pharmacy:PRICE_LIST_TYPE_PUBLIC',
  'pharmacy:PRICE_LIST_ACTIVE',
  'pharmacy:PRICE_ACTIVE',
  'pharmacy_inventory:LOCATION_TYPE_SHELF',
  'pharmacy_inventory:LOCATION_ACTIVE',
  'clinical:MEDICATION_UNIT_TABLET',
  'clinical:MEDICATION_UNIT_CAPSULE',
  'BOB',
];

/** Los conceptos del perfil público y de la dirección se copian de una fila viva. */
const conceptos = {};

/* ── Las farmacias de la vitrina ─────────────────────────────────────────── */

/**
 * Centros de ciudad. Cada farmacia se ubica con un desplazamiento propio para
 * que el mapa muestre puntos separados y las distancias no salgan todas iguales.
 */
const CIUDADES = {
  'La Paz': { lat: -16.4957, lng: -68.1335 },
  'Santa Cruz de la Sierra': { lat: -17.7833, lng: -63.1821 },
  Cochabamba: { lat: -17.3895, lng: -66.1568 },
};

/**
 * Las farmacias que la vitrina exhibe.
 *
 * `nivelDePrecio` mueve el precio de lista de todos sus productos: sin esa
 * variación, «desde Bs X» sería el mismo número en todas y comparar no
 * serviría de nada, que es justamente lo que la pantalla promete.
 */
const FARMACIAS = [
  {
    nombre: 'Farmacia Bolivia Salud',
    ciudad: 'La Paz',
    calle: 'Av. 16 de Julio 1490, El Prado',
    desvio: { lat: 0.004, lng: -0.006 },
    nivelDePrecio: 1.0,
    delivery: true,
  },
  {
    nombre: 'Farmacia Sopocachi',
    ciudad: 'La Paz',
    calle: 'Av. 6 de Agosto 2255, Sopocachi',
    desvio: { lat: -0.012, lng: 0.008 },
    nivelDePrecio: 1.12,
    delivery: false,
  },
  {
    nombre: 'Farmacorp Calacoto',
    ciudad: 'La Paz',
    calle: 'Av. Ballivián 1280, Calacoto',
    desvio: { lat: -0.045, lng: 0.021 },
    nivelDePrecio: 1.24,
    delivery: true,
  },
  {
    nombre: 'Farmacia Cristo Redentor',
    ciudad: 'Santa Cruz de la Sierra',
    calle: 'Av. Cristo Redentor, 3er Anillo',
    desvio: { lat: 0.018, lng: -0.009 },
    nivelDePrecio: 0.94,
    delivery: true,
  },
  {
    nombre: 'Farmacia Equipetrol',
    ciudad: 'Santa Cruz de la Sierra',
    calle: 'Av. San Martín 155, Equipetrol',
    desvio: { lat: 0.011, lng: -0.024 },
    nivelDePrecio: 1.18,
    delivery: true,
  },
  {
    nombre: 'Farmacia Plan Tres Mil',
    ciudad: 'Santa Cruz de la Sierra',
    calle: 'Av. Paurito, Plan Tres Mil',
    desvio: { lat: -0.038, lng: 0.032 },
    nivelDePrecio: 0.88,
    delivery: false,
  },
  {
    nombre: 'Farmacia El Prado Cochabamba',
    ciudad: 'Cochabamba',
    calle: 'Av. Ballivián 640, El Prado',
    desvio: { lat: 0.005, lng: 0.004 },
    nivelDePrecio: 1.02,
    delivery: true,
  },
  {
    nombre: 'Farmacia Cala Cala',
    ciudad: 'Cochabamba',
    calle: 'Av. América 1355, Cala Cala',
    desvio: { lat: -0.021, lng: -0.014 },
    nivelDePrecio: 1.09,
    delivery: false,
  },
];

/**
 * El catálogo, sobre los 17 medicamentos del vademécum real.
 *
 * `precioBase` es el precio de lista en bolivianos de la presentación completa,
 * antes del nivel de la farmacia. `cobertura` es en cuántas de las ocho
 * farmacias aparece: lo que hace que buscar sirva es que **no todas tengan
 * todo** — un antibiótico de segunda línea en dos farmacias y el paracetamol en
 * las ocho es la diferencia entre una vitrina y una lista de precios.
 */
const CATALOGO = [
  { atc: 'N02BE01', marca: 'Panadol', forma: 'tableta', fuerza: '500 mg', envase: 'Caja x 20 tabletas', precioBase: 18.5, receta: false, cobertura: 8 },
  { atc: 'M01AE01', marca: 'Ibupirac', forma: 'tableta', fuerza: '400 mg', envase: 'Caja x 20 tabletas', precioBase: 24.0, receta: false, cobertura: 8 },
  { atc: 'A02BC01', marca: 'Omepral', forma: 'cápsula', fuerza: '20 mg', envase: 'Caja x 30 cápsulas', precioBase: 46.0, receta: false, cobertura: 7 },
  { atc: 'A10BA02', marca: 'Glucophage', forma: 'tableta', fuerza: '850 mg', envase: 'Caja x 30 tabletas', precioBase: 62.0, receta: true, cobertura: 7 },
  { atc: 'C09CA01', marca: 'Cozaar', forma: 'tableta', fuerza: '50 mg', envase: 'Caja x 30 comprimidos', precioBase: 78.0, receta: true, cobertura: 6 },
  { atc: 'C08CA01', marca: 'Norvasc', forma: 'tableta', fuerza: '5 mg', envase: 'Caja x 30 comprimidos', precioBase: 71.0, receta: true, cobertura: 6 },
  { atc: 'C10AA05', marca: 'Lipitor', forma: 'tableta', fuerza: '20 mg', envase: 'Caja x 30 comprimidos', precioBase: 118.0, receta: true, cobertura: 5 },
  { atc: 'J01CA04', marca: 'Amoxil', forma: 'cápsula', fuerza: '500 mg', envase: 'Caja x 21 cápsulas', precioBase: 52.0, receta: true, cobertura: 7 },
  { atc: 'J01FA10', marca: 'Zitromax', forma: 'tableta', fuerza: '500 mg', envase: 'Caja x 3 comprimidos', precioBase: 89.0, receta: true, cobertura: 5 },
  { atc: 'J01MA02', marca: 'Ciproxina', forma: 'tableta', fuerza: '500 mg', envase: 'Caja x 10 comprimidos', precioBase: 67.0, receta: true, cobertura: 4 },
  { atc: 'R03AC02', marca: 'Ventolin', forma: 'tableta', fuerza: '100 mcg/dosis', envase: 'Inhalador 200 dosis', precioBase: 96.0, receta: true, cobertura: 6 },
  { atc: 'C03CA01', marca: 'Lasix', forma: 'tableta', fuerza: '40 mg', envase: 'Caja x 20 comprimidos', precioBase: 38.0, receta: true, cobertura: 4 },
  { atc: 'B01AA03', marca: 'Coumadin', forma: 'tableta', fuerza: '5 mg', envase: 'Caja x 30 comprimidos', precioBase: 84.0, receta: true, cobertura: 3 },
  { atc: 'B01AB05', marca: 'Clexane', forma: 'tableta', fuerza: '40 mg/0,4 ml', envase: 'Caja x 2 jeringas', precioBase: 210.0, receta: true, cobertura: 2 },
  { atc: 'J01DD04', marca: 'Rocephin', forma: 'tableta', fuerza: '1 g', envase: 'Vial inyectable', precioBase: 74.0, receta: true, cobertura: 3 },
  { atc: 'J01GB03', marca: 'Garamicina', forma: 'tableta', fuerza: '80 mg/2 ml', envase: 'Caja x 5 ampollas', precioBase: 58.0, receta: true, cobertura: 2 },
  { atc: 'J01XA01', marca: 'Vancocin', forma: 'tableta', fuerza: '500 mg', envase: 'Vial inyectable', precioBase: 165.0, receta: true, cobertura: 2 },
];

/* ── Utilidades ──────────────────────────────────────────────────────────── */

/** Un uuid estable a partir de una clave: la corrida N da lo mismo que la 1. */
function uuid(clave) {
  const hex = createHash('md5').update(`mantra:farmacias-marketplace:${clave}`).digest('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Un entero estable en `[min, max]` derivado de la clave.
 *
 * El stock y las variaciones de precio tienen que verse distintos entre
 * farmacias, pero **no pueden cambiar en cada corrida**: una captura de
 * evidencia que muestra otro número cada vez no prueba nada.
 */
function pseudoaleatorio(clave, min, max) {
  const hex = createHash('md5').update(clave).digest('hex').slice(0, 8);
  return min + (Number.parseInt(hex, 16) % (max - min + 1));
}

function paso(texto) {
  process.stdout.write(`${texto}\n`);
}

/* ── La corrida ──────────────────────────────────────────────────────────── */

async function resolverConceptos() {
  const { rows } = await db.query(
    `SELECT code, id FROM terminology.catalog_concepts WHERE code = ANY($1::text[])`,
    [CODIGOS],
  );
  const porCodigo = new Map(rows.map((fila) => [fila.code, fila.id]));
  const faltan = CODIGOS.filter((codigo) => !porCodigo.has(codigo));
  if (faltan.length > 0) {
    throw new Error(
      `Faltan conceptos en el catálogo: ${faltan.join(', ')}. Corré el seed de terminología (yarn seed:boot) antes que este script.`,
    );
  }
  for (const [codigo, id] of porCodigo) conceptos[codigo] = id;

  // Los conceptos del perfil público y de la dirección no tienen código
  // estable a mano: se copian de una fila viva, que es la única fuente que no
  // puede quedar desincronizada del seed de comunidad.
  const { rows: modelo } = await db.query(
    `SELECT pp.target_type_concept_id, pp.visibility_concept_id, pp.status_concept_id,
            pp.verification_status_concept_id,
            a.owner_type_concept_id, a.country_concept_id, a.use_concept_id, a.type_concept_id
       FROM community.public_profiles pp
       JOIN common.addresses a ON a.owner_id = pp.target_id
      WHERE pp.display_name ILIKE 'Farmacia%' AND a.latitude IS NOT NULL
      LIMIT 1`,
  );
  if (modelo.length === 0) {
    throw new Error(
      'No hay ninguna farmacia con perfil público y dirección de la cual copiar los conceptos. Corré `yarn seed:vitrina` primero.',
    );
  }
  Object.assign(conceptos, modelo[0]);

  // Lo mismo para el tenant: una farmacia **es** un tenant en este modelo
  // (`public_profiles.tenant_id` apunta a `directory.tenants`), y sus seis
  // conceptos obligatorios no tienen código estable que resolver.
  const { rows: tenantModelo } = await db.query(
    `SELECT t.tenant_type_concept_id, t.legal_entity_type_concept_id, t.status_concept_id,
            t.verification_status_concept_id, t.country_concept_id, t.currency_concept_id,
            t.time_zone
       FROM directory.tenants t
       JOIN community.public_profiles pp ON pp.tenant_id = t.id
      WHERE pp.display_name ILIKE 'Farmacia%'
      LIMIT 1`,
  );
  if (tenantModelo.length === 0) {
    throw new Error('No hay ningún tenant de farmacia del cual copiar los conceptos.');
  }
  conceptos.tenant = tenantModelo[0];
}

/**
 * El tenant de la farmacia.
 *
 * Se crea en vez de reutilizar uno existente porque los tenants de farmacia que
 * ya hay tienen su propio perfil público duplicado colgando: colgarle un segundo
 * perfil dejaría la misma farmacia dos veces en el directorio, que es
 * exactamente lo que este seeder viene a evitar.
 */
async function sembrarTenant(farmacia, tenantId) {
  const modelo = conceptos.tenant;
  await db.query(
    `INSERT INTO directory.tenants
       (id, code, tenant_type_concept_id, legal_name, trade_name, legal_entity_type_concept_id,
        status_concept_id, verification_status_concept_id, country_concept_id,
        currency_concept_id, time_zone, created_at, updated_at, row_version)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, now(), now(), 1)
     ON CONFLICT DO NOTHING`,
    [
      tenantId,
      farmacia.nombre
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^A-Z0-9]+/g, '_'),
      modelo.tenant_type_concept_id,
      `${farmacia.nombre} S.R.L.`,
      farmacia.nombre,
      modelo.legal_entity_type_concept_id,
      modelo.status_concept_id,
      modelo.verification_status_concept_id,
      modelo.country_concept_id,
      conceptos.BOB,
      modelo.time_zone,
    ],
  );
}

async function resolverSedeDePractica() {
  const { rows } = await db.query(
    `SELECT id FROM practice.practice_sites ORDER BY created_at DESC LIMIT 1`,
  );
  if (rows.length === 0) {
    throw new Error(
      'No hay sedes de práctica. `pharmacy_sites.practice_site_id` es NOT NULL y este script no escribe en el dominio de práctica: corré `yarn seed:dev` primero.',
    );
  }
  return rows[0].id;
}

async function resolverVademecum() {
  const { rows } = await db.query(
    `SELECT c.id, c.code, c.display
       FROM terminology.catalog_concepts c
       JOIN terminology.code_system_versions v ON v.id = c.code_system_version_id
       JOIN terminology.code_systems cs ON cs.id = v.code_system_id
      WHERE cs.internal_code = 'vademecum'`,
  );
  if (rows.length === 0) {
    throw new Error('El vademécum está vacío: no hay medicamentos que ofertar.');
  }
  return new Map(rows.map((fila) => [fila.code, fila]));
}

/** El perfil público de la farmacia y su dirección: de ahí sale la geo. */
async function sembrarPerfil(farmacia, tenantId) {
  const centro = CIUDADES[farmacia.ciudad];
  const lat = Number((centro.lat + farmacia.desvio.lat).toFixed(6));
  const lng = Number((centro.lng + farmacia.desvio.lng).toFixed(6));
  const perfilId = uuid(`perfil:${farmacia.nombre}`);
  const slug = `farmacia-${farmacia.nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')}`;

  await db.query(
    `INSERT INTO community.public_profiles
       (id, tenant_id, target_type_concept_id, target_id, slug, display_name, headline,
        verification_status_concept_id, visibility_concept_id, accepts_reviews,
        comments_default_enabled, status_concept_id, created_at, updated_at, row_version)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true,true,$10, now(), now(), 1)
     ON CONFLICT DO NOTHING`,
    [
      perfilId,
      tenantId,
      conceptos.target_type_concept_id,
      tenantId,
      slug,
      farmacia.nombre,
      `Farmacia en ${farmacia.ciudad} · ${farmacia.calle}`,
      conceptos.verification_status_concept_id,
      conceptos.visibility_concept_id,
      conceptos.status_concept_id,
    ],
  );

  await db.query(
    `INSERT INTO common.addresses
       (id, owner_type_concept_id, owner_id, use_concept_id, type_concept_id, lines, city,
        country_concept_id, latitude, longitude, created_at, updated_at, row_version)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, now(), now(), 1)
     ON CONFLICT (id) DO UPDATE SET latitude = EXCLUDED.latitude,
                                    longitude = EXCLUDED.longitude,
                                    updated_at = now()`,
    [
      uuid(`direccion:${farmacia.nombre}`),
      conceptos.owner_type_concept_id,
      tenantId,
      conceptos.use_concept_id,
      conceptos.type_concept_id,
      farmacia.calle,
      farmacia.ciudad,
      conceptos.country_concept_id,
      lat,
      lng,
    ],
  );

  return perfilId;
}

async function sembrarFarmacia(farmacia, indice, practiceSiteId, vademecum) {
  // El tenant es el sujeto de la farmacia: mismo patrón que las organizaciones
  // de la vitrina, donde `target_id` y `tenant_id` son el mismo uuid.
  const tenantId = uuid(`tenant:${farmacia.nombre}`);
  await sembrarTenant(farmacia, tenantId);
  const perfilId = await sembrarPerfil(farmacia, tenantId);

  const farmaciaId = uuid(`farmacia:${farmacia.nombre}`);
  await db.query(
    `INSERT INTO pharmacy.pharmacies
       (id, tenant_id, code, legal_name, trade_name, pharmacy_type_concept_id,
        ownership_type_concept_id, public_profile_id, default_currency_concept_id,
        verification_status_concept_id, status_concept_id, created_at, updated_at, row_version)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, now(), now(), 1)
     ON CONFLICT (id) DO UPDATE SET public_profile_id = EXCLUDED.public_profile_id,
                                    updated_at = now()`,
    [
      farmaciaId,
      tenantId,
      `FAR-${String(indice + 1).padStart(3, '0')}`,
      `${farmacia.nombre} S.R.L.`,
      farmacia.nombre,
      conceptos['pharmacy:PHARMACY_TYPE_RETAIL'],
      conceptos['pharmacy:OWNERSHIP_PRIVATE'],
      perfilId,
      conceptos.BOB,
      conceptos['pharmacy:VERIFICATION_VERIFIED'],
      conceptos['pharmacy:PHARMACY_ACTIVE'],
    ],
  );

  const sedeId = uuid(`sede:${farmacia.nombre}`);
  await db.query(
    `INSERT INTO pharmacy.pharmacy_sites
       (id, pharmacy_id, practice_site_id, code, name, pharmacy_site_type_concept_id,
        dispensing_mode_concept_id, home_delivery_available, pickup_available,
        status_concept_id, created_at, updated_at, row_version)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true,$9, now(), now(), 1)
     ON CONFLICT (id) DO UPDATE SET home_delivery_available = EXCLUDED.home_delivery_available,
                                    updated_at = now()`,
    [
      sedeId,
      farmaciaId,
      practiceSiteId,
      `SED-${String(indice + 1).padStart(3, '0')}`,
      farmacia.nombre,
      conceptos['pharmacy:SITE_TYPE_DISPENSING'],
      conceptos['pharmacy:DISPENSING_MODE_ONSITE'],
      farmacia.delivery,
      conceptos['pharmacy:SITE_ACTIVE'],
    ],
  );

  const ubicacionId = uuid(`ubicacion:${farmacia.nombre}`);
  await db.query(
    `INSERT INTO pharmacy_inventory.inventory_locations
       (id, pharmacy_site_id, code, name, location_type_concept_id, controlled_access,
        status_concept_id, created_at, updated_at, row_version)
     VALUES ($1,$2,'SALA','Sala de venta',$3,false,$4, now(), now(), 1)
     ON CONFLICT (id) DO NOTHING`,
    [
      ubicacionId,
      sedeId,
      conceptos['pharmacy_inventory:LOCATION_TYPE_SHELF'],
      conceptos['pharmacy_inventory:LOCATION_ACTIVE'],
    ],
  );

  let productos = 0;
  for (const [orden, item] of CATALOGO.entries()) {
    // La cobertura decide qué farmacias lo tienen, de forma estable: el
    // desplazamiento por `orden` evita que siempre sean las mismas primeras.
    if ((indice + orden) % FARMACIAS.length >= item.cobertura) continue;

    const concepto = vademecum.get(item.atc);
    if (concepto === undefined) continue;

    const productoId = uuid(`producto:${farmacia.nombre}:${item.atc}`);
    await db.query(
      `INSERT INTO pharmacy.pharmacy_products
         (id, pharmacy_id, product_code, medication_concept_id, brand_name, generic_name,
          strength_text, dosage_form_concept_id, package_size_text, requires_prescription,
          cold_chain_required, status_concept_id, created_at, updated_at, row_version)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,false,$11, now(), now(), 1)
       ON CONFLICT (id) DO UPDATE SET brand_name = EXCLUDED.brand_name, updated_at = now()`,
      [
        productoId,
        farmaciaId,
        `${item.atc}-${String(indice + 1).padStart(2, '0')}`,
        concepto.id,
        item.marca,
        concepto.display,
        item.fuerza,
        item.forma === 'cápsula'
          ? conceptos['clinical:MEDICATION_UNIT_CAPSULE']
          : conceptos['clinical:MEDICATION_UNIT_TABLET'],
        item.envase,
        item.receta,
        conceptos['pharmacy:PRODUCT_ACTIVE'],
      ],
    );

    // Una lista pública **por producto**, y no una por farmacia con todos
    // dentro. No es una preferencia: el único declarado del modelo es
    // `(pharmacy_price_list_id, version_number)` —sin `pharmacy_product_id`—,
    // así que una sola lista no admite el precio de un segundo producto. Con
    // una lista por producto, `version_number` conserva su significado real
    // (la versión del precio) y un cambio futuro puede superseder la anterior.
    // El defecto del índice está en el catálogo generado desde la bóveda
    // (`src/orm/catalog/indexes/pharmacy.idx.ts`), que no se edita a mano.
    const listaId = uuid(`lista:${farmacia.nombre}:${item.atc}`);
    await db.query(
      `INSERT INTO pharmacy.pharmacy_price_lists
         (id, pharmacy_id, pharmacy_site_id, code, price_list_type_concept_id,
          currency_concept_id, valid_from, public_visibility, status_concept_id,
          created_at, updated_at, row_version)
       VALUES ($1,$2,$3,$4,$5,$6, now() - interval '30 days', true, $7, now(), now(), 1)
       ON CONFLICT (id) DO NOTHING`,
      [
        listaId,
        farmaciaId,
        sedeId,
        `PUBLICA-${item.atc}`,
        conceptos['pharmacy:PRICE_LIST_TYPE_PUBLIC'],
        conceptos.BOB,
        conceptos['pharmacy:PRICE_LIST_ACTIVE'],
      ],
    );

    // ±7 % sobre el nivel de la farmacia: dos farmacias del mismo nivel no
    // publican exactamente el mismo número, que es lo que pasa en la calle.
    const ruido = pseudoaleatorio(`precio:${farmacia.nombre}:${item.atc}`, -7, 7) / 100;
    const precio = (item.precioBase * farmacia.nivelDePrecio * (1 + ruido)).toFixed(2);

    await db.query(
      `INSERT INTO pharmacy.pharmacy_product_prices
         (id, pharmacy_price_list_id, pharmacy_product_id, version_number, unit_amount,
          patient_amount, minimum_quantity, effective_from, status_concept_id, recorded_at)
       VALUES ($1,$2,$3,1,$4,$4,1, now() - interval '30 days', $5, now())
       ON CONFLICT (id) DO UPDATE SET unit_amount = EXCLUDED.unit_amount,
                                      patient_amount = EXCLUDED.patient_amount,
                                      recorded_at = now()`,
      [
        uuid(`precio:${farmacia.nombre}:${item.atc}`),
        listaId,
        productoId,
        precio,
        conceptos['pharmacy:PRICE_ACTIVE'],
      ],
    );

    // Una de cada siete combinaciones queda sin stock a propósito: «publicado»
    // y «disponible hoy» son dos cosas distintas y la pantalla las distingue.
    const bruto = pseudoaleatorio(`stock:${farmacia.nombre}:${item.atc}`, 0, 48);
    const disponible = bruto < 7 ? 0 : bruto;

    await db.query(
      `INSERT INTO pharmacy_inventory.inventory_stock_positions
         (id, inventory_location_id, pharmacy_product_id, on_hand_quantity, reserved_quantity,
          quarantine_quantity, available_quantity, last_ledger_sequence, updated_at, row_version)
       VALUES ($1,$2,$3,$4,0,0,$4,0, now(), 1)
       ON CONFLICT (id) DO UPDATE SET on_hand_quantity = EXCLUDED.on_hand_quantity,
                                      available_quantity = EXCLUDED.available_quantity,
                                      updated_at = now()`,
      [uuid(`stock:${farmacia.nombre}:${item.atc}`), ubicacionId, productoId, disponible],
    );

    productos += 1;
  }

  return productos;
}

async function main() {
  await db.connect();
  try {
    paso('· Resolviendo conceptos del catálogo…');
    await resolverConceptos();

    paso('· Resolviendo el vademécum…');
    const vademecum = await resolverVademecum();
    paso(`  ${vademecum.size} medicamentos en el vademécum.`);

    const practiceSiteId = await resolverSedeDePractica();

    let productos = 0;
    for (const [indice, farmacia] of FARMACIAS.entries()) {
      const cuantos = await sembrarFarmacia(farmacia, indice, practiceSiteId, vademecum);
      productos += cuantos;
      paso(`  · ${farmacia.nombre} (${farmacia.ciudad}): ${cuantos} productos.`);
    }

    paso(`\n✓ ${FARMACIAS.length} farmacias y ${productos} productos publicados.`);
  } finally {
    await db.end();
  }
}

main().catch((error) => {
  process.stderr.write(`\n✗ ${error.message}\n`);
  process.exitCode = 1;
});
