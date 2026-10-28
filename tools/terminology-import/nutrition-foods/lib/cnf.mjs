// =============================================================================
// Canadian Nutrient File 2026 (Health Canada) · CSV bilingües (EN/FR) tal cual los publica el titular.
// Cruce por código exacto: `Food_Name.USDA_NDB_Code` es un campo de la fuente; el build lo resuelve contra
// `NDB_number` de FoodData Central solo por igualdad exacta del número.
// =============================================================================
import { csvObjects } from './csv.mjs';
import { openZipStream } from './zip.mjs';

const put = (o, k, v) => { if (v !== undefined && v !== '') o[k] = v; return o; };

async function table(zip, name) {
  const out = [];
  for await (const r of csvObjects(zip.stream(name), name)) out.push(r);
  return out;
}

/** Los CSV de CNF empiezan con BOM; `csvObjects` lo quita del primer bloque. */
export async function readCnf(zipPath) {
  const zip = openZipStream(zipPath);
  const t = {};
  for (const n of ['Food_Name', 'Food_Source', 'CNF_Food_Group', 'Nutrient_Name', 'Nutrient_Source', 'Measure_Name', 'Measure_Type', 'Measure_Weight_Conversion', 'Nutrient_Amount']) t[n] = await table(zip, `${n}.csv`);
  return t;
}

const pair = (en, fr, preferredEn = true) => [
  ...(en ? [{ lang: 'en', value: en, preferred: preferredEn }] : []),
  ...(fr ? [{ lang: 'fr', value: fr, preferred: !en }] : []),
];

function simple({ rows, cs, code, en, fr, prov, extra = () => ({}) }) {
  return rows.map((r) => ({ cs, code: r[code], display: r[en] || r[fr], designations: pair(r[en], r[fr]), parents: [], properties: extra(r), prov }));
}

export function cnfRecords(t, { prov }) {
  const out = {};
  out['cnf-food-group'] = simple({ rows: t.CNF_Food_Group, cs: 'cnf-food-group', code: 'CNF_Food_Group_Code', en: 'CNF_Food_Group_Description_EN', fr: 'CNF_Food_Group_Description_FR', prov });
  out['cnf-food-source'] = simple({ rows: t.Food_Source, cs: 'cnf-food-source', code: 'Food_Source_Code', en: 'Food_Source_Description_EN', fr: 'Food_Source_Description_FR', prov });
  out['cnf-nutrient-source'] = simple({ rows: t.Nutrient_Source, cs: 'cnf-nutrient-source', code: 'Nutrient_Source_Code', en: 'Nutrient_Source_Description_EN', fr: 'Nutrient_Source_Description_FR', prov });
  out['cnf-measure-type'] = simple({ rows: t.Measure_Type, cs: 'cnf-measure-type', code: 'Measure_Type_Code', en: 'Measure_Type_Description_EN', fr: 'Measure_Type_Description_FR', prov });
  out['cnf-measure'] = simple({ rows: t.Measure_Name, cs: 'cnf-measure', code: 'Measure_Code', en: 'Measure_Description_and_Unit_EN', fr: 'Measure_Description_and_Unit_FR', prov });
  out['cnf-nutrient'] = simple({
    rows: t.Nutrient_Name,
    cs: 'cnf-nutrient',
    code: 'Nutrient_Code',
    en: 'Nutrient_Name_EN',
    fr: 'Nutrient_Name_FR',
    prov,
    extra: (r) => put(put(put(put({}, 'nutrient_symbol', r.Nutrient_Symbol), 'nutrient_unit', r.Nutrient_Unit), 'infoods_tagname', r.Tagname), 'nutrient_decimals', r.Nutrient_Decimals),
  });

  const amounts = new Map();
  for (const a of t.Nutrient_Amount) {
    const e = {};
    put(e, 'nutrient_code', a.Nutrient_Code);
    put(e, 'nutrient_amount', a.Nutrient_Amount);
    put(e, 'std_error', a.STD_Error);
    put(e, 'observations', a.Observations);
    put(e, 'nutrient_source_code', a.Nutrient_Source_Code);
    put(e, 'last_updated', a.Nutrient_Last_Updated_Date);
    let l = amounts.get(a.Food_Code);
    if (!l) amounts.set(a.Food_Code, (l = []));
    l.push(e);
  }
  const measures = new Map();
  for (const m of t.Measure_Weight_Conversion) {
    const e = {};
    put(e, 'measure_type_code', m.Measure_Type_Code);
    put(e, 'measure_code', m.Measure_Code);
    put(e, 'measure_weight_conversion', m.Measure_Weight_Conversion);
    put(e, 'last_updated', m.Measure_Weight_Conversion_Last_Updated_Date);
    let l = measures.get(m.Food_Code);
    if (!l) measures.set(m.Food_Code, (l = []));
    l.push(e);
  }
  const groupCodes = new Set(t.CNF_Food_Group.map((g) => g.CNF_Food_Group_Code));
  out['cnf-food'] = t.Food_Name.map((r) => {
    if (r.CNF_Food_Group_Code && !groupCodes.has(r.CNF_Food_Group_Code)) throw new Error(`CNF: alimento ${r.Food_Code} cita grupo ${r.CNF_Food_Group_Code} inexistente`);
    const props = {};
    put(props, 'food_source_code', r.Food_Source_Code);
    put(props, 'usda_ndb_code', r.USDA_NDB_Code);
    put(props, 'cnf_food_group_code', r.CNF_Food_Group_Code);
    put(props, 'scientific_name', r.ScientificName);
    put(props, 'comment_en', r.Comment_EN);
    put(props, 'comment_fr', r.Comment_FR);
    put(props, 'alternate_description_en', r.Alternate_Description_EN);
    put(props, 'alternate_description_fr', r.Alternate_Description_FR);
    put(props, 'food_last_updated', r.Food_Last_Updated_Date);
    if (amounts.has(r.Food_Code)) props.cnf_nutrient_amounts = amounts.get(r.Food_Code);
    if (measures.has(r.Food_Code)) props.cnf_measure_weights = measures.get(r.Food_Code);
    return {
      cs: 'cnf-food',
      code: r.Food_Code,
      display: r.Food_Description_EN || r.Food_Description_FR,
      designations: pair(r.Food_Description_EN, r.Food_Description_FR),
      parents: r.CNF_Food_Group_Code ? [['cnf-food-group', r.CNF_Food_Group_Code]] : [],
      properties: props,
      prov,
    };
  });
  return out;
}

/**
 * Cruce por código exacto: `usda_ndb_code` de CNF contra `ndb_number` de FoodData Central (Foundation / SR Legacy).
 * Solo iguala cadenas idénticas; no se interpreta ni se normaliza el número. Devuelve conteos.
 */
export function linkNdb(cnfFoods, ndbIndex) {
  let exact = 0;
  let missing = 0;
  for (const r of cnfFoods) {
    const n = r.properties.usda_ndb_code;
    if (!n) continue;
    const hits = ndbIndex.get(n);
    if (hits) {
      r.properties.fdc_ndb_exact_matches = hits;
      exact++;
    } else missing++;
  }
  return { withNdb: exact + missing, exact, missing };
}
