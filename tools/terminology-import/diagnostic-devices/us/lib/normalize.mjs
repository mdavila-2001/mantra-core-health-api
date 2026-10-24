// =============================================================================
// Normalizadores: una función por fuente FDA/NLM → filas del formato común
// (`format.mjs`). Ninguna inventa valores: lo que la fuente no publica queda
// en `null`. El alcance diagnóstico lo decide `scope.mjs` por product code.
// =============================================================================

import { clean, fdaRiskClass, isoDate, makeRecord, verbatim } from './format.mjs';
import { classifyScope, panelCode } from './scope.mjs';
import { OFFICIAL_RECORD_URL, authorizationKind } from './sources.mjs';

export const SYSTEM = 'fda-product-code';

// --- Tabla de product codes ----------------------------------------------------

/**
 * Tabla `productCode → { name, panel, deviceClass, regulationNumber, … }`.
 * Se alimenta de la fuente más autorizada disponible: la clasificación FDA
 * (openFDA `device/classification` o `foiclass`) pisa lo deducido de los
 * propios registros de 510(k).
 */
export class ProductCodeTable {
  constructor() {
    this.codes = new Map();
  }

  /** Desde la clasificación oficial (fuente autorizada). */
  addClassification(c) {
    const code = clean(c.product_code)?.toUpperCase();
    if (!code) return;
    const prev = this.codes.get(code) ?? {};
    this.codes.set(code, {
      ...prev,
      code,
      name: clean(c.device_name) ?? prev.name ?? null,
      panel: panelCode(c.medical_specialty) ?? panelCode(c.review_panel) ?? panelCode(c.medical_specialty_description) ?? prev.panel ?? null,
      reviewPanel: panelCode(c.review_panel) ?? prev.reviewPanel ?? null,
      deviceClass: clean(c.device_class) ?? prev.deviceClass ?? null,
      regulationNumber: clean(c.regulation_number) ?? prev.regulationNumber ?? null,
      definition: clean(c.definition) ?? prev.definition ?? null,
      gmpExempt: clean(c.gmp_exempt_flag) ?? prev.gmpExempt ?? null,
      thirdPartyReview: clean(c.third_party_flag) ?? prev.thirdPartyReview ?? null,
      implant: clean(c.implant_flag) ?? prev.implant ?? null,
      lifeSustain: clean(c.life_sustain_support_flag) ?? prev.lifeSustain ?? null,
      submissionType: clean(c.submission_type_id) ?? prev.submissionType ?? null,
      classificationSource: c.__source ?? 'classification',
      scope: undefined,
    });
  }

  /**
   * Desde un registro que trae product code + regulación + panel (510(k),
   * listado). Sólo completa huecos; nunca pisa la clasificación oficial.
   * Si un código aparece con varias regulaciones, gana la más frecuente.
   */
  observe(code, { regulationNumber, panel, deviceClass, name }) {
    const pc = clean(code)?.toUpperCase();
    if (!pc) return;
    const prev = this.codes.get(pc) ?? { code: pc, observed: {} };
    const obs = prev.observed ?? {};
    const key = `${clean(regulationNumber) ?? ''}|${panelCode(panel) ?? ''}|${clean(deviceClass) ?? ''}`;
    obs[key] = (obs[key] ?? 0) + 1;
    const next = { ...prev, observed: obs };
    if (!next.name && clean(name)) next.name = clean(name);
    if (prev.classificationSource === undefined) {
      const [reg, pan, cls] = Object.entries(obs).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0].split('|');
      next.regulationNumber = reg || null;
      next.panel = pan || null;
      next.deviceClass = cls || null;
      delete next.scope;
    }
    this.codes.set(pc, next);
  }

  get(code) {
    return this.codes.get(String(code ?? '').toUpperCase()) ?? null;
  }

  /** Decisión de alcance por código (memorizada). */
  scope(code) {
    const e = this.get(code);
    if (!e) return { include: false, rule: 'product_code:unknown', reason: 'Product code sin clasificación ni registros' };
    if (!e.scope) e.scope = classifyScope({ productCode: e.code, regulationNumber: e.regulationNumber, panel: e.panel });
    return e.scope;
  }

  /** Filas para `fda-product-codes.json`, ordenadas por código. */
  rows() {
    return [...this.codes.values()]
      .map((e) => {
        const s = this.scope(e.code);
        return {
          productCode: e.code,
          deviceName: e.name ?? null,
          panel: e.panel ?? null,
          deviceClass: e.deviceClass ?? null,
          regulationNumber: e.regulationNumber ?? null,
          include: s.include,
          rule: s.rule,
          reason: s.reason,
          classificationSource: e.classificationSource ?? 'observed',
          url: OFFICIAL_RECORD_URL.PRODUCT_CODE(e.code),
        };
      })
      .sort((a, b) => a.productCode.localeCompare(b.productCode));
  }
}

function typeFields(table, code) {
  const e = table.get(code);
  return {
    deviceTypeCode: clean(code)?.toUpperCase() ?? null,
    deviceTypeSystem: clean(code) ? SYSTEM : null,
    deviceTypeName: e?.name ?? null,
  };
}

function scopeExtra(table, code) {
  const e = table.get(code);
  const s = table.scope(code);
  return { panel: e?.panel ?? null, regulationNumber: e?.regulationNumber ?? null, scopeRule: s.rule };
}

// --- 510(k) y De Novo -----------------------------------------------------------

/**
 * Fila de `dataset/devices.csv` del espejo `choiben314/510k-lineage` (una por
 * número K/DEN del export openFDA `device/510k`). `device_name` es el nombre
 * comercial (proprietary/trade name) declarado en la notificación.
 */
export function from510kLineage(row, table, prov) {
  const id = clean(row.k_number)?.toUpperCase();
  if (!id) return null;
  if (!table.scope(row.product_code).include) return null;
  const kind = authorizationKind(id);
  return makeRecord(
    {
      source: kind === 'DENOVO' ? 'fda-denovo' : 'fda-510k',
      sourceRecordId: id,
      sourceUrl: OFFICIAL_RECORD_URL[kind ?? '510K'](id),
      sourceVersion: prov.sourceVersion,
      retrievedAt: prov.retrievedAt,
      ...typeFields(table, row.product_code),
      manufacturerName: verbatim(row.applicant),
      manufacturerCountry: null,
      manufacturerRegistryId: null,
      brandName: verbatim(row.device_name),
      model: null,
      udiDi: null,
      riskClass: fdaRiskClass(row.device_class),
      authorizationId: id,
      authorizationDate: isoDate(row.decision_date),
      status: null, // el espejo no conserva `decision_description`; ver extra.currentlyListed
    },
    {
      recordLevel: 'authorization',
      ...scopeExtra(table, row.product_code),
      reviewPanel: panelCode(row.review_panel),
      dateReceived: isoDate(row.date_received),
      currentlyListed: row.currently_listed === '1',
      hasSummary: row.has_summary === '1',
      recalled: row.recalled === '1',
      recallClass: clean(row.recall_class),
      firstRecallDate: isoDate(row.first_recall_date),
      via: prov.via,
    },
  );
}

/** Resultado de openFDA `device/510k` (fuente oficial, cuando el host esté habilitado). */
export function fromOpenFda510k(r, table, prov) {
  const id = clean(r.k_number)?.toUpperCase();
  if (!id || !table.scope(r.product_code).include) return null;
  const kind = authorizationKind(id);
  return makeRecord(
    {
      source: kind === 'DENOVO' ? 'fda-denovo' : 'fda-510k',
      sourceRecordId: id,
      sourceUrl: OFFICIAL_RECORD_URL[kind ?? '510K'](id),
      sourceVersion: prov.sourceVersion,
      retrievedAt: prov.retrievedAt,
      ...typeFields(table, r.product_code),
      manufacturerName: verbatim(r.applicant),
      manufacturerCountry: clean(r.country_code)?.toUpperCase() ?? null,
      manufacturerRegistryId: null,
      brandName: verbatim(r.device_name),
      model: null,
      udiDi: null,
      riskClass: fdaRiskClass(r.openfda?.device_class),
      authorizationId: id,
      authorizationDate: isoDate(r.decision_date),
      status: verbatim(r.decision_description) ?? verbatim(r.decision_code),
    },
    {
      recordLevel: 'authorization',
      ...scopeExtra(table, r.product_code),
      decisionCode: clean(r.decision_code),
      clearanceType: clean(r.clearance_type),
      dateReceived: isoDate(r.date_received),
      city: clean(r.city),
      state: clean(r.state),
      via: prov.via,
    },
  );
}

// --- PMA ---------------------------------------------------------------------------

/**
 * openFDA `device/pma`: una fila por (PMA, nombre comercial). El original y
 * los suplementos que cambian el nombre comercial (nuevos modelos) quedan
 * como filas distintas; los demás suplementos se cuentan en `extra`.
 */
export function fromOpenFdaPma(results, table, prov) {
  const groups = new Map();
  for (const r of results) {
    const pma = clean(r.pma_number)?.toUpperCase();
    if (!pma || !table.scope(r.product_code).include) continue;
    const trade = clean(r.trade_name) ?? clean(r.generic_name) ?? '';
    const key = `${pma}|${trade.toUpperCase()}`;
    const g = groups.get(key) ?? { first: r, supplements: 0 };
    if (clean(r.supplement_number)) g.supplements++;
    if (isoDate(r.decision_date) && (!isoDate(g.first.decision_date) || isoDate(r.decision_date) < isoDate(g.first.decision_date))) g.first = r;
    groups.set(key, g);
  }
  return [...groups.entries()].map(([key, { first: r, supplements }]) => {
    const pma = clean(r.pma_number).toUpperCase();
    const sup = clean(r.supplement_number);
    return makeRecord(
      {
        source: 'fda-pma',
        sourceRecordId: `${pma}${sup ? `/${sup}` : ''}|${key.split('|')[1]}`,
        sourceUrl: OFFICIAL_RECORD_URL.PMA(pma),
        sourceVersion: prov.sourceVersion,
        retrievedAt: prov.retrievedAt,
        ...typeFields(table, r.product_code),
        manufacturerName: verbatim(r.applicant),
        manufacturerCountry: null,
        manufacturerRegistryId: null,
        brandName: verbatim(r.trade_name),
        model: null,
        udiDi: null,
        riskClass: fdaRiskClass(r.openfda?.device_class),
        authorizationId: pma,
        authorizationDate: isoDate(r.decision_date),
        status: verbatim(r.decision_code),
      },
      { recordLevel: 'authorization', ...scopeExtra(table, r.product_code), genericName: clean(r.generic_name), supplementNumber: sup, supplementsSameName: supplements, decisionCode: clean(r.decision_code), via: prov.via },
    );
  });
}

// --- Registration & Listing ------------------------------------------------------

const ISO2 = /^[A-Z]{2}$/;

/**
 * openFDA `device/registrationlisting`: una fila por (establecimiento,
 * product code, nombre propietario). Es la fuente de marcas por fabricante y
 * de país del establecimiento.
 */
export function fromOpenFdaRegistrationListing(r, table, prov) {
  const reg = r.registration ?? {};
  const regNo = clean(reg.registration_number) ?? clean(reg.fei_number);
  const out = [];
  for (const p of r.products ?? []) {
    const pc = clean(p.product_code)?.toUpperCase();
    if (!pc) continue;
    if (!table.scope(pc).include) continue;
    const names = (p.proprietary_name ?? []).map(clean).filter(Boolean);
    const auth = clean(p.k_number) ?? clean(p.pma_number) ?? null;
    for (const name of names.length ? names : [null]) {
      const country = clean(reg.iso_country_code)?.toUpperCase();
      out.push(
        makeRecord(
          {
            source: 'fda-rl',
            sourceRecordId: `${regNo}|${pc}|${name ?? ''}`,
            sourceUrl: OFFICIAL_RECORD_URL.REGISTRATION(regNo ?? ''),
            sourceVersion: prov.sourceVersion,
            retrievedAt: prov.retrievedAt,
            ...typeFields(table, pc),
            manufacturerName: verbatim(reg.owner_operator?.firm_name) ?? clean(reg.name),
            manufacturerCountry: country && ISO2.test(country) ? country : null,
            manufacturerRegistryId: regNo ? `fda-reg:${regNo}` : null,
            brandName: name,
            model: null,
            udiDi: null,
            riskClass: fdaRiskClass(p.openfda?.device_class),
            authorizationId: auth?.toUpperCase() ?? null,
            authorizationDate: null,
            status: null,
          },
          { recordLevel: 'listing', ...scopeExtra(table, pc), establishmentName: clean(reg.name), establishmentTypes: r.establishment_type ?? [], ownerOperatorNumber: clean(reg.owner_operator?.owner_operator_number), via: prov.via },
        ),
      );
    }
  }
  return out;
}

// --- Observación previa (completa la tabla de product codes antes de emitir) ------

/** Pasada de observación de un resultado de `device/registrationlisting`. */
export function observeListing(r, table) {
  for (const p of r.products ?? []) {
    table.observe(p.product_code, { regulationNumber: p.openfda?.regulation_number, panel: p.openfda?.medical_specialty_description, deviceClass: p.openfda?.device_class, name: p.openfda?.device_name });
  }
}

/** Pasada de observación de un resultado de `device/udi`. */
export function observeUdi(r, table) {
  for (const p of r.product_codes ?? []) {
    table.observe(p.code, { regulationNumber: p.openfda?.regulation_number, panel: p.openfda?.medical_specialty_description, deviceClass: p.openfda?.device_class, name: p.name ?? p.openfda?.device_name });
  }
}

/** Pasada de observación de un resultado de `device/510k` o `device/pma`. */
export function observeSubmission(r, table) {
  table.observe(r.product_code, { regulationNumber: r.openfda?.regulation_number, panel: r.openfda?.medical_specialty_description ?? r.advisory_committee_description, deviceClass: r.openfda?.device_class, name: r.openfda?.device_name });
}

// --- GUDID (openFDA device/udi y AccessGUDID delimitado) ---------------------------

function primaryDi(identifiers) {
  return (identifiers ?? []).find((i) => String(i.type ?? '').toLowerCase() === 'primary') ?? null;
}

/**
 * GMDN que publica GUDID: código sólo si viene (`gmdn`), si no el término
 * preferido sin código (`gmdn-pt`). Va en `extra.deviceTypes` (README común).
 */
function gmdnDeviceTypes(terms) {
  return (terms ?? [])
    .map((g) => {
      const code = clean(g.code);
      const name = verbatim(g.name);
      if (!code && !name) return null;
      return { system: code ? 'gmdn' : 'gmdn-pt', code: code ?? null, name, definition: verbatim(g.definition) };
    })
    .filter(Boolean);
}

/** Primer product code en alcance (orden publicado por la fuente). */
function firstInScope(codes, table) {
  return codes.find((c) => table.scope(c).include) ?? null;
}

/** Resultado de openFDA `device/udi` (un DI primario por resultado). */
export function fromOpenFdaUdi(r, table, prov) {
  const di = primaryDi(r.identifiers);
  if (!di?.id) return null;
  const codes = (r.product_codes ?? []).map((p) => clean(p.code)?.toUpperCase()).filter(Boolean);
  const pc = firstInScope(codes, table);
  if (!pc) return null;
  const sub = (r.premarket_submissions ?? []).map((s) => clean(s.submission_number)?.toUpperCase()).filter(Boolean);
  const gmdn = r.gmdn_terms ?? [];
  return makeRecord(
    {
      source: 'fda-gudid',
      sourceRecordId: clean(di.id),
      sourceUrl: OFFICIAL_RECORD_URL.GUDID(clean(di.id)),
      sourceVersion: prov.sourceVersion,
      retrievedAt: prov.retrievedAt,
      ...typeFields(table, pc),
      manufacturerName: verbatim(r.company_name),
      manufacturerCountry: null,
      manufacturerRegistryId: clean(r.labeler_duns_number) ? `duns:${clean(r.labeler_duns_number)}` : null,
      brandName: verbatim(r.brand_name),
      model: verbatim(r.version_or_model_number),
      udiDi: clean(di.id),
      riskClass: fdaRiskClass(r.product_codes?.find((p) => clean(p.code)?.toUpperCase() === pc)?.openfda?.device_class),
      authorizationId: sub[0] ?? null,
      authorizationDate: null,
      status: verbatim(r.commercial_distribution_status),
    },
    {
      recordLevel: 'udi_di',
      ...scopeExtra(table, pc),
      issuingAgency: clean(di.issuing_agency),
      productCodes: codes,
      premarketSubmissions: sub,
      deviceTypes: gmdnDeviceTypes(gmdn),
      catalogNumber: clean(r.catalog_number),
      publicVersionDate: isoDate(r.public_version_date),
      commercialDistributionEndDate: isoDate(r.commercial_distribution_end_date),
      isRx: r.is_rx === 'true' || r.is_rx === true,
      isOtc: r.is_otc === 'true' || r.is_otc === true,
      via: prov.via,
    },
  );
}

/**
 * Fila unida de AccessGUDID delimitado: `device` (de `device.txt`) más los
 * arreglos ya agrupados por PrimaryDI de `productCodes.txt`,
 * `premarketSubmissions.txt` y `gmdnTerms.txt`.
 */
export function fromAccessGudidDelimited(device, { productCodes, submissions, gmdn }, table, prov) {
  const di = clean(device.PrimaryDI ?? device.primaryDi);
  if (!di) return null;
  const codes = productCodes.map((p) => clean(p.productCode)?.toUpperCase()).filter(Boolean);
  const pc = firstInScope(codes, table);
  if (!pc) return null;
  const subs = submissions.map((s) => clean(s.submissionNumber)?.toUpperCase()).filter(Boolean);
  const duns = clean(device.dunsNumber ?? device.DUNSNumber);
  return makeRecord(
    {
      source: 'fda-gudid',
      sourceRecordId: di,
      sourceUrl: OFFICIAL_RECORD_URL.GUDID(di),
      sourceVersion: prov.sourceVersion,
      retrievedAt: prov.retrievedAt,
      ...typeFields(table, pc),
      manufacturerName: verbatim(device.companyName),
      manufacturerCountry: null,
      manufacturerRegistryId: duns ? `duns:${duns}` : null,
      brandName: verbatim(device.brandName),
      model: verbatim(device.versionModelNumber),
      udiDi: di,
      riskClass: fdaRiskClass(table.get(pc)?.deviceClass),
      authorizationId: subs[0] ?? null,
      authorizationDate: null,
      status: verbatim(device.deviceCommDistributionStatus),
    },
    {
      recordLevel: 'udi_di',
      ...scopeExtra(table, pc),
      productCodes: codes,
      premarketSubmissions: subs,
      deviceTypes: gmdnDeviceTypes(gmdn.map((g) => ({ code: g.gmdnCode, name: g.gmdnPTName, definition: g.gmdnPTDefinition }))),
      catalogNumber: clean(device.catalogNumber),
      publicVersionDate: isoDate(device.publicVersionDate),
      commercialDistributionEndDate: isoDate(device.deviceCommDistributionEndDate),
      via: prov.via,
    },
  );
}

// --- Espejo bjoleary/fdadata (archivos de descarga de FDA convertidos de .rda) ----

/** `'<NA>'` de los factores de R → `null`. */
function na(v) {
  return v === '<NA>' || v === 'NaN' ? null : v;
}

/** fdadata guarda la regulación como número (868.582): las secciones 21 CFR llevan 4 decimales. */
export function regulationFromNumber(v) {
  if (v === null || v === undefined || v === '') return null;
  const [part, sec = ''] = String(v).split('.');
  return /^\d{3}$/.test(part) ? `${part}.${sec.padEnd(4, '0')}` : null;
}

/** Fila de `product_codes.rda` de fdadata → entrada para `ProductCodeTable.addClassification`. */
export function classificationFromFdadata(r) {
  return {
    product_code: na(r.product_code),
    device_name: na(r.device_type_name),
    review_panel: na(r.review_panel),
    medical_specialty: na(r.medical_specialty),
    device_class: na(r.device_class),
    regulation_number: regulationFromNumber(na(r.regulation)),
    definition: na(r.definition),
    implant_flag: na(r.implant),
    life_sustain_support_flag: na(r.life_sustaining),
    submission_type_id: na(r.submission_type),
    __source: 'fdadata:product_codes',
  };
}

/** Fila de `foiclass.txt` (FDA, delimitado por `|`) → entrada de clasificación. */
export function classificationFromFoiclass(r) {
  return {
    product_code: r.PRODUCTCODE,
    device_name: r.DEVICENAME,
    review_panel: r.REVIEW_PANEL,
    medical_specialty: r.MEDICALSPECIALTY,
    device_class: r.DEVICECLASS,
    regulation_number: r.REGULATIONNUMBER,
    definition: r.DEFINITION,
    gmp_exempt_flag: r.GMPEXEMPTFLAG,
    third_party_flag: r.THIRDPARTYFLAG,
    implant_flag: r.Implant_Flag,
    life_sustain_support_flag: r.Life_Sustain_support_flag,
    submission_type_id: r.SUBMISSION_TYPE_ID,
    __source: 'fda:foiclass',
  };
}

/** `pmn.rda` de fdadata (archivos pmn*.zip de FDA): 510(k) y De Novo, con dirección y país. */
export function fromFdadataPmn(r, table, prov) {
  const id = clean(r.submission_number)?.toUpperCase();
  if (!id || !table.scope(na(r.product_code)).include) return null;
  const kind = authorizationKind(id);
  if (kind !== '510K' && kind !== 'DENOVO') return null;
  const country = clean(na(r.country))?.toUpperCase();
  return makeRecord(
    {
      source: kind === 'DENOVO' ? 'fda-denovo' : 'fda-510k',
      sourceRecordId: id,
      sourceUrl: OFFICIAL_RECORD_URL[kind](id),
      sourceVersion: prov.sourceVersion,
      retrievedAt: prov.retrievedAt,
      ...typeFields(table, na(r.product_code)),
      manufacturerName: verbatim(na(r.sponsor)),
      manufacturerCountry: country && /^[A-Z]{2}$/.test(country) ? country : null,
      manufacturerRegistryId: null,
      brandName: verbatim(na(r.device)),
      model: null,
      udiDi: null,
      riskClass: fdaRiskClass(table.get(na(r.product_code))?.deviceClass),
      authorizationId: id,
      authorizationDate: isoDate(r.date_decision),
      status: verbatim(na(r.decision)),
    },
    {
      recordLevel: 'authorization',
      ...scopeExtra(table, na(r.product_code)),
      decisionCode: clean(na(r.decision_code)),
      dateReceived: isoDate(r.date_start),
      track: clean(na(r.track)),
      thirdPartyReview: clean(na(r.third_party_review)),
      summaryType: clean(na(r.summary)),
      address: [r.address_line_1, r.address_line_2, r.city, r.state, r.zip_code].map(na).map(verbatim).filter(Boolean).join(', ') || null,
      contact: verbatim(na(r.contact)),
      via: prov.via,
    },
  );
}

/**
 * `pma.rda` de fdadata (pma.zip de FDA, con suplementos `P…/S…`): una fila por
 * (PMA, nombre comercial). El primer registro con ese nombre (por fecha de
 * decisión) da la fecha; los demás se cuentan.
 */
export function fromFdadataPma(rows, table, prov) {
  // Suplementos sin product code publicado heredan el del PMA original (mismo dispositivo).
  const parentCode = new Map();
  for (const r of rows) {
    const pma = clean(r.submission_number)?.toUpperCase().split('/')[0];
    if (pma && na(r.product_code) && !parentCode.has(pma)) parentCode.set(pma, na(r.product_code));
  }
  const groups = new Map();
  for (const raw of rows) {
    const full = clean(raw.submission_number)?.toUpperCase();
    if (!full) continue;
    const [pma, sup = null] = full.split('/');
    if (authorizationKind(pma) !== 'PMA' && authorizationKind(pma) !== 'HDE') continue;
    const inherited = !na(raw.product_code) && parentCode.has(pma);
    const r = inherited ? { ...raw, product_code: parentCode.get(pma), __inherited: true } : raw;
    if (!table.scope(na(r.product_code)).include) continue;
    const trade = verbatim(na(r.device)) ?? verbatim(na(r.generic_name)) ?? '';
    const key = `${pma}|${trade.toUpperCase()}`;
    const g = groups.get(key) ?? { first: null, sup: null, count: 0, supplements: [] };
    g.count++;
    if (sup) g.supplements.push(sup);
    const d = isoDate(r.date_decision) ?? '9999-12-31';
    if (!g.first || d < (isoDate(g.first.date_decision) ?? '9999-12-31') || (d === (isoDate(g.first.date_decision) ?? '9999-12-31') && !sup)) {
      g.first = r;
      g.sup = sup;
    }
    groups.set(key, g);
  }
  return [...groups.entries()].map(([key, g]) => {
    const r = g.first;
    const pma = key.split('|')[0];
    const kind = authorizationKind(pma);
    return makeRecord(
      {
        source: 'fda-pma',
        sourceRecordId: `${pma}${g.sup ? `/${g.sup}` : ''}`,
        sourceUrl: OFFICIAL_RECORD_URL[kind](pma),
        sourceVersion: prov.sourceVersion,
        retrievedAt: prov.retrievedAt,
        ...typeFields(table, na(r.product_code)),
        manufacturerName: verbatim(na(r.sponsor)),
        manufacturerCountry: null,
        manufacturerRegistryId: null,
        brandName: verbatim(na(r.device)),
        model: null,
        udiDi: null,
        riskClass: fdaRiskClass(table.get(na(r.product_code))?.deviceClass) ?? 'fda:3',
        authorizationId: pma,
        authorizationDate: isoDate(r.date_decision),
        status: verbatim(na(r.decision)),
      },
      {
        recordLevel: 'authorization',
        ...scopeExtra(table, na(r.product_code)),
        kind,
        genericName: verbatim(na(r.generic_name)),
        decisionCode: clean(na(r.decision_code)),
        recordsWithThisName: g.count,
        productCodeFromParentPma: r.__inherited === true,
        supplements: [...new Set(g.supplements)].sort(),
        docketNumber: clean(na(r.docket_number)),
        address: [r.address_line_1, r.address_line_2, r.city, r.state, r.zip_code].map(na).map(verbatim).filter(Boolean).join(', ') || null,
        countryAsPublished: clean(na(r.country)),
        via: prov.via,
      },
    );
  });
}

/**
 * Lista FDA «AI-Enabled Medical Devices» (espejo ej86): número de envío,
 * dispositivo, empresa, panel y product code. Sirve para marcar
 * `extra.fdaAiEnabledList` y para agregar los envíos que falten.
 */
export function fromAiList(r, table, prov) {
  const id = clean(r['Submission Number'])?.toUpperCase();
  const pc = clean(r['Primary Product Code'])?.toUpperCase();
  if (!id || !table.scope(pc).include) return null;
  const kind = authorizationKind(id);
  if (!kind || !OFFICIAL_RECORD_URL[kind]) return null;
  return makeRecord(
    {
      source: kind === 'DENOVO' ? 'fda-denovo' : kind === 'PMA' || kind === 'HDE' ? 'fda-pma' : 'fda-510k',
      sourceRecordId: id,
      sourceUrl: OFFICIAL_RECORD_URL[kind](id),
      sourceVersion: prov.sourceVersion,
      retrievedAt: prov.retrievedAt,
      ...typeFields(table, pc),
      manufacturerName: verbatim(r.Company),
      manufacturerCountry: null,
      manufacturerRegistryId: null,
      brandName: verbatim(r.Device),
      model: null,
      udiDi: null,
      riskClass: fdaRiskClass(table.get(pc)?.deviceClass),
      authorizationId: id,
      authorizationDate: isoDate(r['Date of Final Decision']),
      status: null,
    },
    { recordLevel: 'authorization', ...scopeExtra(table, pc), fdaAiEnabledList: true, via: prov.via },
  );
}

/**
 * `<device>` del AccessGUDID Full Release XML (espejo Delapro/GUDID, panel
 * dental). Una fila por UDI-DI primaria.
 */
export function fromGudidXml(xml, table, prov, { xmlTag, xmlBlocks }) {
  const ids = xmlBlocks(xml, 'identifier').map((b) => ({ id: xmlTag(b, 'deviceId'), type: xmlTag(b, 'deviceIdType'), agency: xmlTag(b, 'deviceIdIssuingAgency') }));
  const di = ids.find((i) => String(i.type).toLowerCase() === 'primary');
  if (!di?.id) return null;
  const codes = xmlBlocks(xml, 'fdaProductCode').map((b) => ({ code: clean(xmlTag(b, 'productCode'))?.toUpperCase(), name: verbatim(xmlTag(b, 'productCodeName')) })).filter((c) => c.code);
  const pc = firstInScope(codes.map((c) => c.code), table);
  if (!pc) return null;
  const subs = xmlBlocks(xml, 'premarketSubmission').map((b) => clean(xmlTag(b, 'submissionNumber'))?.toUpperCase()).filter(Boolean);
  const gmdn = xmlBlocks(xml, 'gmdn').map((b) => ({ code: xmlTag(b, 'gmdnCode'), name: xmlTag(b, 'gmdnPTName'), definition: xmlTag(b, 'gmdnPTDefinition') }));
  const duns = clean(xmlTag(xml, 'dunsNumber'));
  const id = clean(di.id);
  return makeRecord(
    {
      source: 'fda-gudid',
      sourceRecordId: id,
      sourceUrl: OFFICIAL_RECORD_URL.GUDID(id),
      sourceVersion: prov.sourceVersion,
      retrievedAt: prov.retrievedAt,
      deviceTypeCode: pc,
      deviceTypeSystem: SYSTEM,
      deviceTypeName: codes.find((c) => c.code === pc)?.name ?? table.get(pc)?.name ?? null,
      manufacturerName: verbatim(xmlTag(xml, 'companyName')),
      manufacturerCountry: null,
      manufacturerRegistryId: duns ? `duns:${duns}` : null,
      brandName: verbatim(xmlTag(xml, 'brandName')),
      model: verbatim(xmlTag(xml, 'versionModelNumber')),
      udiDi: id,
      riskClass: fdaRiskClass(table.get(pc)?.deviceClass),
      authorizationId: subs[0] ?? null,
      authorizationDate: null,
      status: verbatim(xmlTag(xml, 'deviceCommDistributionStatus')),
    },
    {
      recordLevel: 'udi_di',
      ...scopeExtra(table, pc),
      issuingAgency: clean(di.agency),
      publicDeviceRecordKey: clean(xmlTag(xml, 'publicDeviceRecordKey')),
      deviceRecordStatus: clean(xmlTag(xml, 'deviceRecordStatus')),
      productCodes: codes.map((c) => c.code),
      premarketSubmissions: subs,
      deviceTypes: gmdnDeviceTypes(gmdn),
      catalogNumber: verbatim(xmlTag(xml, 'catalogNumber')),
      deviceDescription: verbatim(xmlTag(xml, 'deviceDescription')),
      publicVersionDate: isoDate(xmlTag(xml, 'publicVersionDate')),
      commercialDistributionEndDate: isoDate(xmlTag(xml, 'deviceCommDistributionEndDate')),
      rx: xmlTag(xml, 'rx') === 'true',
      otc: xmlTag(xml, 'otc') === 'true',
      via: prov.via,
    },
  );
}
