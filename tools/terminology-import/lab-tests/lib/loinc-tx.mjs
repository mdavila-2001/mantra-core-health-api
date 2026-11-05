// =============================================================================
// LOINC sin cuenta: tx.fhir.org + NLM CTSS → la misma entrada que `loincRecords`
// arma desde la distribución oficial (`Loinc.csv` y anexos).
//
// De tx.fhir.org (fetch-loinc-txfhir.mjs): código, nombre largo inglés, clase,
// CLASSTYPE (por clase), STATUS, ORDER_OBS y las designaciones en-US / es-*.
// De NLM (fetch-loinc-ctss.mjs): COMPONENT, PROPERTY, METHOD_TYP,
// RELATEDNAMES2, CONSUMER_NAME, datatype, unidades UCUM y miembros de paneles.
//
// Lo que ninguna de las dos vías da por término queda vacío y no se escribe:
// TIME_ASPCT, SYSTEM y SCALE_TYP en inglés. El nombre corto es-AR de LOINC es el
// nombre totalmente especificado («componente:propiedad:tiempo:sistema:escala:método»),
// y de él salen los seis ejes EN CASTELLANO, verbatim, sólo cuando trae
// exactamente esos seis campos.
// =============================================================================

const pick = (designations, lang, use) => designations.find((d) => d.lang === lang && d.use === use)?.value ?? null;

/** «a:b:c:d:e:f» (con «:» final opcional) → los seis ejes; null si no son exactamente seis. */
export function partsFromFullySpecifiedName(fsn) {
  if (!fsn) return null;
  const fields = fsn.endsWith(':') ? fsn.slice(0, -1).split(':') : fsn.split(':');
  if (fields.length !== 6 && !(fields.length === 5 && fsn.endsWith(':'))) return null;
  const [component, property, time_aspct, system, scale_typ, method_typ = ''] = fields.map((f) => f.trim());
  if (!component || !property) return null;
  return Object.fromEntries(Object.entries({ component, property, time_aspct, system, scale_typ, method_typ }).filter(([, v]) => v));
}

/**
 * @param {object} tx        contenido de loinc-txfhir.json
 * @param {object} ctss      contenido de loinc-ctss-items.json
 * @param {object|null} pan  contenido de loinc-ctss-panels.json
 * @returns {{ table, classNames, panels, es, extra, stats }}
 */
export function txToLoincInput(tx, ctss, pan) {
  const table = [];
  const es = new Map();
  const extra = new Map();
  let withEs = 0;
  let withCtss = 0;
  for (const [code, t] of Object.entries(tx.terms)) {
    const c = ctss.items[code] ?? null;
    if (c) withCtss += 1;
    const d = t.designations ?? [];
    table.push({
      LOINC_NUM: code,
      LONG_COMMON_NAME: pick(d, 'en-US', 'LONG_COMMON_NAME') ?? t.display ?? '',
      SHORTNAME: pick(d, 'en-US', 'SHORTNAME') ?? '',
      CLASS: t.class,
      CLASSTYPE: tx.classes[t.class]?.classType ?? '',
      STATUS: t.status ?? 'ACTIVE',
      ORDER_OBS: t.orderObs ?? '',
      COMPONENT: c?.COMPONENT ?? '',
      PROPERTY: c?.PROPERTY ?? '',
      METHOD_TYP: c?.METHOD_TYP ?? '',
      TIME_ASPCT: '',
      SYSTEM: '',
      SCALE_TYP: '',
      RELATEDNAMES2: c?.RELATEDNAMES2 ?? '',
      CONSUMER_NAME: c?.CONSUMER_NAME || pick(d, 'en-US', 'ConsumerName') || '',
      EXAMPLE_UCUM_UNITS: (c?.units ?? []).map((u) => u.unit).filter(Boolean).join(';'),
    });
    const esLong = pick(d, 'es-MX', 'LONG_COMMON_NAME') ?? pick(d, 'es-ES', 'LONG_COMMON_NAME') ?? pick(d, 'es-AR', 'LONG_COMMON_NAME');
    const esShort = pick(d, 'es-AR', 'SHORTNAME') ?? pick(d, 'es-MX', 'SHORTNAME') ?? pick(d, 'es-ES', 'SHORTNAME');
    const esDisplay = d.find((x) => x.lang?.startsWith('es') && x.use === 'LinguisticVariantDisplayName')?.value ?? null;
    const preferred = esLong ?? esDisplay ?? esShort;
    if (preferred) {
      withEs += 1;
      es.set(code, {
        preferred,
        synonyms: [...new Set([esShort, esDisplay].filter((x) => x && x !== preferred))],
        relatedNames: [],
        parts: partsFromFullySpecifiedName(pick(d, 'es-AR', 'SHORTNAME')) ?? {},
        variants: [...new Set(d.filter((x) => x.lang?.startsWith('es')).map((x) => `${x.lang} ${x.use}`))],
      });
    }
    const ext = {};
    if (c?.datatype) ext.loinc_datatype_nlm = c.datatype;
    if (t.onlyFromStatusFilter) ext.loinc_listed_only_by_status_filter = true;
    if (Object.keys(ext).length) extra.set(code, ext);
  }
  const classNames = new Map(Object.entries(tx.classes).map(([name, info]) => [name, { partNumber: info.partNumber, display: name }]));
  const panels = new Map(
    Object.entries(pan?.panels ?? {}).map(([parent, members]) => [parent, members.map((m) => ({ loinc: m.loinc, sequence: m.sequence, ...(m.displayNameForForm ? { displayNameForForm: m.displayNameForForm } : {}) }))]),
  );
  return {
    table,
    classNames,
    panels,
    es,
    extra,
    stats: { terms: table.length, withCtss, withSpanish: withEs, classes: classNames.size, panelsWithMembers: panels.size, ctssOnly: Object.keys(ctss.items).filter((k) => !tx.terms[k]).length },
  };
}
