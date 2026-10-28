// =============================================================================
// FoodData_Central · vocabularios de apoyo (nutrientes, categorías, unidades, tipos de atributo, derivaciones).
// Cada tabla aparece en varios .zip con ediciones distintas; se une por clave y gana la edición más nueva
// (orden de `order`). Si la misma clave trae contenido distinto en otra edición, se anota en `conflicts` (no se corrige).
// =============================================================================
import { compact, fdcTable } from './fdc.mjs';

async function all(zip, name) {
  const out = [];
  for await (const r of fdcTable(zip, name)) out.push(r);
  return out;
}

/** Une `tables` ([{key, rows}]) por `keyOf`; devuelve filas únicas con el artefacto de origen y los conflictos. */
function union(tables, keyOf, label) {
  const byKey = new Map();
  const conflicts = [];
  for (const { key, rows } of tables) {
    for (const r of rows) {
      const k = keyOf(r);
      const prev = byKey.get(k);
      if (!prev) {
        byKey.set(k, { row: r, from: key, alsoIn: [] });
        continue;
      }
      prev.alsoIn.push(key);
      for (const f of Object.keys(r)) if (prev.row[f] !== r[f]) conflicts.push({ table: label, key: k, field: f, kept: prev.row[f], keptIn: prev.from, other: r[f], otherIn: key });
    }
  }
  return { items: [...byKey.values()], conflicts };
}

/** `zips` = { key: zipHandle } en orden de precedencia (más nueva primero). */
export async function fdcVocabRecords(zips) {
  const keys = Object.keys(zips);
  const tablesOf = async (name, only = keys) => {
    const out = [];
    for (const key of only) if (zips[key].has(name)) out.push({ key, rows: await all(zips[key], name) });
    return out;
  };
  const conflicts = [];
  const records = {};
  const take = (u) => { conflicts.push(...u.conflicts); return u.items; };

  records['usda-fdc-nutrient'] = take(union(await tablesOf('nutrient.csv'), (r) => r.id, 'nutrient')).map(({ row: r, from }) => ({
    cs: 'usda-fdc-nutrient',
    code: r.id,
    display: r.name,
    designations: [{ lang: 'en', value: r.name, preferred: true }],
    parents: [],
    properties: compact({ unit_name: r.unit_name, nutrient_nbr: r.nutrient_nbr, rank: r.rank }),
    prov: [from, 'nutrient.csv'],
  }));

  records['usda-fdc-food-category'] = take(union(await tablesOf('food_category.csv'), (r) => r.id, 'food_category')).map(({ row: r, from }) => ({
    cs: 'usda-fdc-food-category',
    code: r.id,
    display: r.description,
    designations: [{ lang: 'en', value: r.description, preferred: true }],
    parents: [],
    properties: compact({ usda_category_code: r.code }),
    prov: [from, 'food_category.csv'],
  }));

  records['usda-fdc-wweia-category'] = take(union(await tablesOf('wweia_food_category.csv'), (r) => r.wweia_food_category, 'wweia_food_category')).map(({ row: r, from }) => ({
    cs: 'usda-fdc-wweia-category',
    code: r.wweia_food_category,
    display: r.wweia_food_category_description,
    designations: [{ lang: 'en', value: r.wweia_food_category_description, preferred: true }],
    parents: [],
    properties: {},
    prov: [from, 'wweia_food_category.csv'],
  }));

  records['usda-fdc-measure-unit'] = take(union(await tablesOf('measure_unit.csv'), (r) => r.id, 'measure_unit')).map(({ row: r, from }) => ({
    cs: 'usda-fdc-measure-unit',
    code: r.id,
    display: r.name,
    designations: [{ lang: 'en', value: r.name, preferred: true }],
    parents: [],
    properties: {},
    prov: [from, 'measure_unit.csv'],
  }));

  records['usda-fdc-attribute-type'] = take(union(await tablesOf('food_attribute_type.csv'), (r) => r.id, 'food_attribute_type')).map(({ row: r, from }) => ({
    cs: 'usda-fdc-attribute-type',
    code: r.id,
    display: r.name,
    definition: r.description || undefined,
    designations: [{ lang: 'en', value: r.name, preferred: true }],
    parents: [],
    properties: {},
    prov: [from, 'food_attribute_type.csv'],
  }));

  records['usda-fdc-fndds-derivation'] = take(union(await tablesOf('fndds_derivation.csv', ['fdc-survey']), (r) => r['derivation code'], 'fndds_derivation')).map(({ row: r, from }) => ({
    cs: 'usda-fdc-fndds-derivation',
    code: r['derivation code'],
    display: r['derivation description'],
    designations: [{ lang: 'en', value: r['derivation description'], preferred: true }],
    parents: [],
    properties: {},
    prov: [from, 'fndds_derivation.csv'],
  }));

  records['usda-fdc-nutrient-source'] = take(union(await tablesOf('food_nutrient_source.csv', ['fdc-sr-legacy']), (r) => r.id, 'food_nutrient_source')).map(({ row: r, from }) => ({
    cs: 'usda-fdc-nutrient-source',
    code: r.id,
    display: r.description,
    designations: [{ lang: 'en', value: r.description, preferred: true }],
    parents: [],
    properties: compact({ usda_source_code: r.code }),
    prov: [from, 'food_nutrient_source.csv'],
  }));

  records['usda-fdc-nutrient-derivation'] = take(union(await tablesOf('food_nutrient_derivation.csv', ['fdc-sr-legacy']), (r) => r.id, 'food_nutrient_derivation')).map(({ row: r, from }) => ({
    cs: 'usda-fdc-nutrient-derivation',
    code: r.id,
    display: r.description,
    designations: [{ lang: 'en', value: r.description, preferred: true }],
    parents: [],
    properties: compact({ usda_derivation_code: r.code, source_id: r.source_id }),
    prov: [from, 'food_nutrient_derivation.csv'],
  }));

  return { records, conflicts };
}
