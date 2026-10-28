// =============================================================================
// USDA FoodData Central · lectores de los CSV oficiales (Foundation, SR Legacy, Survey/FNDDS, Branded).
// Todo es verbatim de la fuente: los textos y los números se guardan como vienen (cadenas), sin traducir ni
// redondear. Las columnas vacías no generan clave. Cruces solo por código exacto que publica el propio archivo
// (food.food_category_id → food_category.id, food.food_category_id → wweia_food_category, branded_food_category).
// =============================================================================
import { csvObjects } from './csv.mjs';
import { openZipStream } from './zip.mjs';

/** Abre una entrada CSV de un .zip de FDC y entrega objetos (streaming). */
export function fdcTable(zip, name) {
  return csvObjects(zip.stream(name), name);
}

async function toArray(iter) {
  const out = [];
  for await (const x of iter) out.push(x);
  return out;
}

/** Sólo claves con valor (las celdas vacías no se guardan: la fuente no dice nada). */
export function compact(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) if (v !== '' && v !== undefined && v !== null) out[k] = v;
  return out;
}

const NAMES = { 'fdc-foundation': 'foundation_food', 'fdc-sr-legacy': 'sr_legacy_food', 'fdc-survey': 'survey_fndds_food', 'fdc-branded': 'branded_food' };

// ---- vocabularios (nutrient, measure_unit, categorías, derivaciones) --------------------------------------------

/** nutrient.csv de cada zip → una fila por id; gana la edición más nueva y se anota si otra edición difiere. */
export async function readNutrients(zips) {
  const byId = new Map();
  const conflicts = [];
  for (const { key, zip } of zips) {
    for (const r of await toArray(fdcTable(zip, 'nutrient.csv'))) {
      const prev = byId.get(r.id);
      if (!prev) {
        byId.set(r.id, { ...r, seenIn: [key] });
      } else {
        prev.seenIn.push(key);
        for (const f of ['name', 'unit_name', 'nutrient_nbr', 'rank']) {
          if (prev[f] !== r[f]) conflicts.push({ id: r.id, field: f, kept: prev[f], other: r[f], otherIn: key });
        }
      }
    }
  }
  return { nutrients: [...byId.values()], conflicts };
}

export async function readSimpleTable(zip, name) {
  return toArray(fdcTable(zip, name));
}

// ---- datos por alimento (valores, porciones, atributos) --------------------------------------------------------

/** Agrupa filas de una tabla por `fdc_id`, sólo para los ids pedidos. */
export async function groupByFdcId(zip, name, ids, pick) {
  const out = new Map();
  for await (const r of fdcTable(zip, name)) {
    if (!ids.has(r.fdc_id)) continue;
    let list = out.get(r.fdc_id);
    if (!list) out.set(r.fdc_id, (list = []));
    list.push(pick(r));
  }
  return out;
}

export const pickNutrient = (r) => compact({ nutrient_id: r.nutrient_id, amount: r.amount, data_points: r.data_points, derivation_id: r.derivation_id, min: r.min, max: r.max, median: r.median, loq: r.loq, footnote: r.footnote, min_year_acquired: r.min_year_acquired });
export const pickPortion = (r) => compact({ seq_num: r.seq_num, amount: r.amount, measure_unit_id: r.measure_unit_id, portion_description: r.portion_description, modifier: r.modifier, gram_weight: r.gram_weight, data_points: r.data_points, footnote: r.footnote, min_year_acquired: r.min_year_acquired });
export const pickAttribute = (r) => compact({ seq_num: r.seq_num, food_attribute_type_id: r.food_attribute_type_id, name: r.name, value: r.value });

/**
 * Alimentos de un zip (Foundation, SR Legacy o Survey) como registros normalizados.
 * `cs` = code system de los alimentos; `categoryCs` = code system del padre que cita `food.food_category_id`.
 */
export async function readFoods({ key, zipPath, cs }) {
  const zip = openZipStream(zipPath);
  const dataType = NAMES[key];
  const foods = [];
  for await (const r of fdcTable(zip, 'food.csv')) if (r.data_type === dataType) foods.push(r);
  const ids = new Set(foods.map((f) => f.fdc_id));

  // tabla específica del tipo (NDB_number / food_code…)
  const specific = new Map();
  const specificName = { 'fdc-foundation': 'foundation_food.csv', 'fdc-sr-legacy': 'sr_legacy_food.csv', 'fdc-survey': 'survey_fndds_food.csv' }[key];
  for await (const r of fdcTable(zip, specificName)) specific.set(r.fdc_id, r);

  const categories = key === 'fdc-survey' ? null : new Map((await toArray(fdcTable(zip, 'food_category.csv'))).map((c) => [c.id, c]));
  const nutrients = await groupByFdcId(zip, 'food_nutrient.csv', ids, pickNutrient);
  const portions = await groupByFdcId(zip, 'food_portion.csv', ids, pickPortion);
  const attributes = await groupByFdcId(zip, 'food_attribute.csv', ids, pickAttribute);

  const records = [];
  for (const f of foods) {
    const sp = specific.get(f.fdc_id) ?? {};
    const props = compact({
      fdc_data_type: f.data_type,
      publication_date: f.publication_date,
      ndb_number: sp.NDB_number,
      footnote: sp.footnote,
      food_code: sp.food_code,
      wweia_category_number: sp.wweia_category_number,
      survey_start_date: sp.start_date,
      survey_end_date: sp.end_date,
    });
    if (nutrients.has(f.fdc_id)) props.fdc_nutrients = nutrients.get(f.fdc_id);
    if (portions.has(f.fdc_id)) props.fdc_portions = portions.get(f.fdc_id);
    if (attributes.has(f.fdc_id)) props.fdc_attributes = attributes.get(f.fdc_id);
    const parents = [];
    if (f.food_category_id !== '') {
      if (categories) {
        const cat = categories.get(f.food_category_id);
        if (!cat) throw new Error(`${key}: food ${f.fdc_id} cita food_category_id ${f.food_category_id} que food_category.csv no define`);
        parents.push(['usda-fdc-food-category', cat.id]);
      } else {
        parents.push(['usda-fdc-wweia-category', f.food_category_id]);
      }
    }
    if (key === 'fdc-survey' && sp.wweia_category_number && sp.wweia_category_number !== f.food_category_id) {
      throw new Error(`survey: food ${f.fdc_id}: food_category_id ${f.food_category_id} ≠ wweia_category_number ${sp.wweia_category_number}`);
    }
    records.push({ cs, code: f.fdc_id, display: f.description, parents, properties: props, prov: [key, 'food.csv'] });
  }
  return records;
}

/** Branded: une `food.csv` y `branded_food.csv` por fdc_id (streaming; `food.csv` cabe en un Map). */
export async function* readBrandedFoods({ zipPath, cs, stats = {} }) {
  const zip = openZipStream(zipPath);
  const foodById = new Map();
  for await (const r of fdcTable(zip, 'food.csv')) {
    if (r.data_type !== 'branded_food') throw new Error(`branded food.csv trae data_type ${r.data_type}`);
    foodById.set(r.fdc_id, { description: r.description, publication_date: r.publication_date });
  }
  const seen = new Set();
  for await (const b of fdcTable(zip, 'branded_food.csv')) {
    const f = foodById.get(b.fdc_id);
    if (!f) throw new Error(`branded_food.csv cita fdc_id ${b.fdc_id} que food.csv no define`);
    if (seen.has(b.fdc_id)) throw new Error(`branded_food.csv repite fdc_id ${b.fdc_id}`);
    seen.add(b.fdc_id);
    const props = compact({
      fdc_data_type: 'branded_food',
      publication_date: f.publication_date,
      brand_owner: b.brand_owner,
      brand_name: b.brand_name,
      subbrand_name: b.subbrand_name,
      gtin_upc: b.gtin_upc,
      data_source: b.data_source,
      market_country: b.market_country,
      available_date: b.available_date,
      modified_date: b.modified_date,
      discontinued_date: b.discontinued_date,
    });
    const parents = b.branded_food_category !== '' ? [['usda-fdc-branded-category', b.branded_food_category]] : [];
    yield { cs, code: b.fdc_id, display: f.description === '' ? b.fdc_id : f.description, ...(f.description === '' ? { displayFallback: true } : {}), parents, properties: props, prov: ['fdc-branded', 'food.csv + branded_food.csv'] };
    foodById.delete(b.fdc_id);
  }
  // la fuente trae el alimento en food.csv pero no en branded_food.csv: no se carga (no hay dato de marca) y se cuenta
  stats.foodWithoutBrandedRow = foodById.size;
}
