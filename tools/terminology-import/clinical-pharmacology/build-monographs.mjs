#!/usr/bin/env node
// =============================================================================
// Farmacología clínica · etapa 2 (sin red): cachés → monografías NDJSON.
//
// Una monografía por ATC 5 del universo (CIMA ∪ maestra ATC ∪ LINAME ∪
// vademecum) que tenga al menos un medicamento de CIMA o una sección de alguna
// fuente. Cada sección es literal de UN documento de UNA fuente; no se fusiona.
// Lo que falta (sin ficha bajada, sin versión, sin ATC 5, sin UNII) se cuenta
// en el meta para el informe de cobertura.
//
// Salida: clinical-pharmacology/out/monographs.ndjson + monographs.meta.json
// (`--granularity product`: out/product/monographs.product.ndjson + .meta.json,
// que no se empaqueta en `data/` ni se carga; ver lib/paths.mjs).
// Uso: node tools/terminology-import/clinical-pharmacology/build-monographs.mjs [--granularity route|product]
// =============================================================================

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { readNdjson, writeJson, writeNdjson } from '../lib/glossary-es/common.mjs';
import { cimaSafetyNotes, cimaSections, groupByAtc5, referenceDocuments } from './lib/cima.mjs';
import { listJson, parseArgs, readJsonIfExists, retrievedAtOf } from './lib/cli.mjs';
import { buildGsrsIndex, combineLinks, gsrsDisplayFor, linkUniiSet, moietiesOf, rxnavIndex, uniiForCas } from './lib/gsrs.mjs';
import { EMA_LICENSE, emaIndicationSection, emaRecords, isHumanAuthorised } from './lib/ema.mjs';
import { cimaNregCandidates, comparisonKey, emaPiPointer, emaPiSection, emaPiSlug, emaPiUrl, fidelityKey, isVerifiedSection, keyDiff, piMonographSections, piSmpcsFromRows } from './lib/ema-pi.mjs';
import { dailyMedPointer } from './lib/dailymed.mjs';
import { emlReference, isCurrentRecommendation } from './lib/eml.mjs';
import { lactmedIdentity, lactmedSections } from './lib/lactmed.mjs';
import { livertoxIdentity, livertoxSections } from './lib/livertox.mjs';
import { readAllInputs, readBridge, readDailyMedIdentities, readEma, readEml, readLactmed, readLivertox } from './lib/inputs.mjs';
import { zipResults } from './lib/json-stream.mjs';
import { assertSection, atcNameIndex, buildMonograph, hasVersion } from './lib/monograph.mjs';
import { labelIdentity, openFdaPharmClasses, openFdaSections, referenceLabels } from './lib/openfda.mjs';
import { cpOut, emaPiPdfPath, emaPiRowsPath, ftPath, ftSectionPath, monographsOutputs, notesPath, openFdaDir } from './lib/paths.mjs';

const { opt, has } = parseArgs();
const GRANULARITY = opt('--granularity', 'route');
/** Con `--granularity product` la salida va a `out/product/`: nunca pisa el corpus por vía ni se empaqueta en `data/`. */
const OUTPUT = monographsOutputs(GRANULARITY);
/** `--no-cima`: arma sin CIMA (para medir por separado lo que aporta cada fuente en el registro de pasadas). */
const NO_CIMA = has('--no-cima');
/** `--no-ema`: arma sin el informe de la EMA (medición por pasada). */
const NO_EMA = has('--no-ema');
/** `--no-eml`: arma sin la eEML de la OMS (medición por pasada). */
const NO_EML = has('--no-eml');
/** `--no-dailymed`: arma sin las identidades SPL de DailyMed (medición por pasada). */
const NO_DAILYMED = has('--no-dailymed');
/** `--no-lactmed`: arma sin LactMed (medición por pasada). */
const NO_LACTMED = has('--no-lactmed');
/** `--no-livertox`: arma sin LiverTox (medición por pasada). */
const NO_LIVERTOX = has('--no-livertox');
/** `--no-ema-pi`: arma sin la información de producto de la EMA en PDF (medición por pasada). */
const NO_EMA_PI = has('--no-ema-pi');

/** Ficha completa + secciones sueltas de respaldo, en ese orden (la completa gana). */
function readCimaDoc(nreg) {
  const path = ftPath(nreg);
  if (!existsSync(path)) return null;
  const parts = [readJsonIfExists(path)];
  const dir = join(ftSectionPath(nreg, 'x'), '..');
  for (const name of listJson(dir)) parts.push(readJsonIfExists(join(dir, name)));
  const retrievedAt = [path, ...listJson(dir).map((n) => join(dir, n))].map(retrievedAtOf).sort().at(-1);
  return { doc: parts.filter(Array.isArray).flat(), retrievedAt };
}

/** Itera las etiquetas de cada partición bajada, en streaming (una etiqueta por vez). */
async function* openFdaLabels() {
  const dir = join(openFdaDir(), 'label');
  if (!existsSync(dir)) return;
  const zips = readdirSync(dir).filter((n) => n.endsWith('.zip')).sort();
  for (const zip of zips) {
    const path = join(dir, zip);
    const retrievedAt = retrievedAtOf(path);
    for await (const label of zipResults(path)) yield { label, partition: zip, retrievedAt };
  }
}

const OPENFDA_TYPES = new Set(['HUMAN PRESCRIPTION DRUG', 'HUMAN OTC DRUG']);

/**
 * Etiquetas de openFDA enlazadas a un ATC 5 SÓLO por código.
 *   1. GSRS (fracción activa + WHO-ATC, `lib/gsrs.mjs#linkUniiSet`).
 *   2. RxNav: ATC 5 → ingrediente(s) → UNII, normalizado a fracción activa con el
 *      GSRS. Sólo cuenta si ese conjunto de fracciones tiene UN único ATC 5 en
 *      RxNav (un ingrediente con varios ATC por vía o uso sigue ambiguo).
 * Reglas de combinación (`lib/gsrs.mjs#combineLinks`): GSRS enlazado + RxNav
 * distinto → conflicto, no se enlaza; GSRS ambiguo + RxNav único dentro de los
 * candidatos → se enlaza; GSRS sin ATC + RxNav único → se enlaza.
 * Pasada A: identidades y enlace; pasada B: texto completo de las de referencia.
 */
/** UNII de los principios → ATC 5, con la misma regla para toda fuente (GSRS + RxNav + desempate AEMPS). */
function uniiDecider({ bridges, gsrs, inUse, rxnavByMoieties = rxnavIndex(bridges.values(), gsrs) }) {
  return (unii) => {
    const g = gsrs ? linkUniiSet(unii, gsrs) : { status: 'none', atc: null, rule: null, moieties: [], candidates: [] };
    const decided = combineLinks(g, rxnavByMoieties.get(moietiesOf(unii, gsrs).join('+')) ?? [], { inUse });
    return { g, decided };
  };
}

async function openFdaLinked({ bridges, gsrs, inUse, dailymed }) {
  const rxnavByMoieties = rxnavIndex(bridges.values(), gsrs);
  const link = {
    scanned: 0,
    humanRxOrOtc: 0,
    withoutUnii: 0,
    gsrs: { unique: 0, 'who-atc-50-series': 0, ambiguous: 0, none: 0, 'unknown-unii': 0 },
    final: {},
    rxnavBridges: { atc5: [...bridges.values()].filter((b) => b?.complete).length, moietySets: rxnavByMoieties.size },
  };
  const groups = new Map(); // atc → Map(uniiKey → { ids, rules:Set })
  const ambiguous = new Map(); // fracciones→candidatos → etiquetas (las que siguen sin enlazar)
  const seenSetIds = new Set();
  const decide = uniiDecider({ bridges, gsrs, inUse, rxnavByMoieties });
  for await (const { label } of openFdaLabels()) {
    link.scanned++;
    if (label.set_id) seenSetIds.add(label.set_id);
    let id = labelIdentity(label);
    // Etiqueta sin bloque `openfda`: si DailyMed la lista como Rx humana (doctype 34391-3) y su SPL declara
    // los UNII de los principios activos, se usan esos identificadores. El texto sigue siendo el de openFDA.
    const dm = id.unii.length === 0 ? dailymed?.get(label.set_id) : null;
    if (dm?.unii?.length) {
      id = { ...id, unii: dm.unii, routes: id.routes.length ? id.routes : dm.routes, productType: id.productType ?? 'HUMAN PRESCRIPTION DRUG', uniiSource: 'nlm-dailymed-spl' };
      link.uniiFromDailyMed = (link.uniiFromDailyMed ?? 0) + 1;
    }
    if (!OPENFDA_TYPES.has(id.productType)) continue;
    link.humanRxOrOtc++;
    if (id.unii.length === 0) {
      link.withoutUnii++;
      continue;
    }
    const key = id.unii.join('+');
    const { g, decided } = decide(id.unii);
    link.gsrs[g.status === 'linked' ? g.rule : g.status]++;
    link.final[decided.rule] = (link.final[decided.rule] ?? 0) + 1;
    if (!decided.atc) {
      if (g.status === 'ambiguous') {
        const k = `${g.moieties.join('+')}→${g.candidates.join(',')}`;
        ambiguous.set(k, (ambiguous.get(k) ?? 0) + 1);
      }
      continue;
    }
    const targets = new Map([[decided.atc, id.uniiSource ? `${decided.rule} (UNII: SPL de DailyMed)` : decided.rule]]);
    for (const [atc, rule] of targets) {
      if (!groups.has(atc)) groups.set(atc, new Map());
      const byKey = groups.get(atc);
      if (!byKey.has(key)) byKey.set(key, { ids: [], rules: new Set() });
      byKey.get(key).ids.push(id);
      byKey.get(key).rules.add(rule);
    }
  }
  const refs = new Map();
  for (const [atc, byKey] of groups) {
    const list = [];
    for (const [key, { ids, rules }] of byKey) {
      for (const ref of referenceLabels(ids, key.split('+'))) {
        list.push({ ...ref, group: { ...ref.group, atc, atcLinkRule: [...rules].sort().join(', ') } });
      }
    }
    refs.set(atc, list);
  }
  const chosen = new Set([...refs.values()].flat().map((r) => r.identity.id));
  const labels = new Map();
  for await (const { label, retrievedAt } of openFdaLabels()) if (chosen.has(label.id)) labels.set(label.id, { label, retrievedAt });
  // Etiquetas Rx que sólo están en DailyMed: puntero (sin texto; licencia del texto de terceros no confirmada).
  const pointers = new Map();
  for (const [setId, dm] of dailymed ?? []) {
    if (seenSetIds.has(setId) || !dm.unii?.length) continue;
    const { decided } = decide(dm.unii);
    link.dailyMedOnly = (link.dailyMedOnly ?? 0) + 1;
    if (!decided.atc) continue;
    link.dailyMedOnlyLinked = (link.dailyMedOnlyLinked ?? 0) + 1;
    if (!pointers.has(decided.atc)) pointers.set(decided.atc, []);
    pointers.get(decided.atc).push(dailyMedPointer(dm, decided.rule));
  }
  link.ambiguousTop = [...ambiguous.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 40)
    .map(([k, labels]) => {
      const [moieties, candidates] = k.split('→');
      return { moieties: moieties.split('+').map((u) => ({ unii: u, name: gsrs?.byUnii.get(u)?.name ?? null })), candidates: candidates.split(','), labels };
    });
  return { refs, labels, link, pointers };
}

async function main() {
  const t0 = Date.now();
  const inputs = readAllInputs();
  const { liname } = inputs;
  const products = NO_CIMA ? [] : inputs.products;
  const master = NO_CIMA ? [] : inputs.master;
  const universe = NO_CIMA ? new Map([...inputs.universe].map(([c, o]) => [c, o.filter((x) => !x.startsWith('cima-'))]).filter(([, o]) => o.length)) : inputs.universe;
  const names = atcNameIndex({ master, products });
  const { byAtc, withoutAtc5 } = groupByAtc5(products);
  console.log(`=== Monografías: universo ${universe.size} ATC 5; CIMA ${products.length} medicamentos (${withoutAtc5.length} sin ATC 5) ===`);

  const bridges = new Map([...universe.keys()].map((c) => [c, readBridge(c)]));
  const gsrs = existsSync(cpOut('gsrs-entries.ndjson')) ? buildGsrsIndex(readNdjson(cpOut('gsrs-entries.ndjson'))) : null;
  // ATC 5 que la AEMPS asigna a medicamentos autorizados (desempate de conflictos GSRS/RxNav, sólo por código).
  const inUse = new Set(byAtc.keys());
  const dailymed = NO_DAILYMED ? new Map() : readDailyMedIdentities();
  const fda = await openFdaLinked({ bridges, gsrs, inUse, dailymed });
  for (const code of [...fda.pointers.keys()].sort()) if (!universe.has(code)) universe.set(code, ['dailymed-spl']);
  console.log(`[openfda] ${fda.link.scanned} etiquetas leídas; ${fda.labels.size} de referencia en ${fda.refs.size} ATC 5`);
  for (const code of [...fda.refs.keys()].sort()) if (!universe.has(code)) universe.set(code, ['openfda-gsrs']);

  // EMA: indicación literal de cada medicamento autorizado, por el ATC 5 que asigna la propia EMA.
  const emaRaw = NO_EMA ? null : readEma();
  const emaByAtc = new Map();
  const emaStats = { records: 0, humanAuthorised: 0, withoutAtc5: 0, withoutIndication: 0 };
  if (emaRaw) {
    const records = emaRecords(emaRaw.rows);
    emaStats.records = records.length;
    for (const r of records.filter(isHumanAuthorised)) {
      emaStats.humanAuthorised++;
      if (r.atc5.length === 0) {
        emaStats.withoutAtc5++;
        continue;
      }
      const sec = emaIndicationSection(r, emaRaw.retrievedAt);
      if (!sec) {
        emaStats.withoutIndication++;
        continue;
      }
      for (const code of r.atc5) {
        if (!emaByAtc.has(code)) emaByAtc.set(code, []);
        emaByAtc.get(code).push(sec);
        if (!universe.has(code)) universe.set(code, ['ema']);
      }
    }
  }

  // eEML (OMS): SÓLO referencias (ids y enlaces) de cada recomendación vigente, por el ATC 5 que asigna la OMS.
  // Sin texto: la licencia excluye la publicidad o promoción de productos comerciales y no está confirmado el uso (issue 824).
  const emlRaw = NO_EML ? null : readEml();
  const emlRefsByAtc = new Map();
  const emlStats = { recommendations: 0, current: 0, withoutAtc5: 0, references: 0 };
  if (emlRaw) {
    emlStats.recommendations = emlRaw.records.length;
    for (const { rec, retrievedAt } of emlRaw.records) {
      if (!isCurrentRecommendation(rec)) continue;
      emlStats.current++;
      if (rec.atc5.length === 0) {
        emlStats.withoutAtc5++;
        continue;
      }
      const ref = emlReference(rec, retrievedAt);
      for (const code of rec.atc5) {
        if (!emlRefsByAtc.has(code)) emlRefsByAtc.set(code, []);
        emlRefsByAtc.get(code).push(ref);
        emlStats.references++;
        if (!universe.has(code)) universe.set(code, ['who-eeml']);
      }
    }
  }

  // LactMed (NLM): secciones de lactancia, enlazadas por los UNII del registro con la misma regla que openFDA.
  const lactmedRaw = NO_LACTMED ? null : readLactmed();
  const lactmedByAtc = new Map();
  const lactmedStats = { records: 0, withoutUnii: 0, withoutSections: 0, linked: 0, final: {}, duplicateSections: 0 };
  if (lactmedRaw) {
    const decide = uniiDecider({ bridges, gsrs, inUse });
    for (const { xml, retrievedAt } of lactmedRaw.records()) {
      const id = lactmedIdentity(xml);
      if (!id.id) continue;
      lactmedStats.records++;
      if (id.unii.length === 0) {
        lactmedStats.withoutUnii++;
        continue;
      }
      const { decided } = decide(id.unii);
      lactmedStats.final[decided.rule] = (lactmedStats.final[decided.rule] ?? 0) + 1;
      if (!decided.atc) continue;
      const rows = lactmedSections(xml, retrievedAt, {
        accession: lactmedRaw.accessions.get(id.id) ?? null,
        selection: { criterion: 'Registro de LactMed cuyos UNII enlazan, por código, a este ATC 5 (misma regla GSRS + RxNav que openFDA).', group: { unii: id.unii, atcLinkRule: decided.rule } },
      });
      if (rows.length === 0) {
        lactmedStats.withoutSections++;
        continue;
      }
      lactmedStats.linked++;
      if (!lactmedByAtc.has(decided.atc)) lactmedByAtc.set(decided.atc, new Map());
      const seen = lactmedByAtc.get(decided.atc);
      for (const r of rows) {
        const k = `${r.key}|${r.textSha256}`;
        if (seen.has(k)) {
          const kept = seen.get(k);
          kept.document.alsoIn = [...(kept.document.alsoIn ?? []), r.document.id];
          lactmedStats.duplicateSections++;
          continue;
        }
        seen.set(k, r);
      }
      if (!universe.has(decided.atc)) universe.set(decided.atc, ['nlm-lactmed']);
    }
  }

  // LiverTox (NIDDK): hepatotoxicidad; CAS del registro → UNII (CAS PRIMARY del GSRS) → misma regla que openFDA.
  const livertoxRaw = NO_LIVERTOX ? null : readLivertox();
  const livertoxByAtc = new Map();
  const livertoxStats = { records: 0, withoutCas: 0, casUnresolved: 0, withoutSections: 0, linked: 0, final: {}, duplicateSections: 0 };
  if (livertoxRaw && gsrs) {
    const decide = uniiDecider({ bridges, gsrs, inUse });
    for (const { xml, retrievedAt } of livertoxRaw.records()) {
      const id = livertoxIdentity(xml);
      if (!id.id) continue;
      livertoxStats.records++;
      if (id.cas.length === 0) {
        livertoxStats.withoutCas++;
        continue;
      }
      const unii = id.cas.map((c) => uniiForCas(c, gsrs));
      if (unii.some((u) => !u)) {
        livertoxStats.casUnresolved++;
        continue;
      }
      const { decided } = decide([...new Set(unii)].sort());
      livertoxStats.final[decided.rule] = (livertoxStats.final[decided.rule] ?? 0) + 1;
      if (!decided.atc) continue;
      const rows = livertoxSections(xml, retrievedAt, {
        accession: livertoxRaw.accessions.get(id.id) ?? null,
        selection: { criterion: 'Registro de LiverTox cuyos CAS (→ UNII por el CAS PRIMARY del GSRS) enlazan, por código, a este ATC 5 (misma regla GSRS + RxNav que openFDA).', group: { cas: id.cas, unii: [...new Set(unii)].sort(), atcLinkRule: decided.rule } },
      });
      if (rows.length === 0) {
        livertoxStats.withoutSections++;
        continue;
      }
      livertoxStats.linked++;
      if (!livertoxByAtc.has(decided.atc)) livertoxByAtc.set(decided.atc, new Map());
      const seen = livertoxByAtc.get(decided.atc);
      for (const r of rows) {
        const k = `${r.key}|${r.textSha256}`;
        if (seen.has(k)) {
          const kept = seen.get(k);
          kept.document.alsoIn = [...(kept.document.alsoIn ?? []), r.document.id];
          livertoxStats.duplicateSections++;
          continue;
        }
        seen.set(k, r);
      }
      if (!universe.has(decided.atc)) universe.set(decided.atc, ['niddk-livertox']);
    }
  }

  // EMA, información de producto (PDF en castellano), leída con el extractor verificado (py/ema_pi_extract.py).
  // Si el nº EU está en CIMA, es el mismo documento y ya entra por CIMA: sirve para medir la fidelidad de la
  // extracción contra CIMA. Si no está, se publican las secciones verificadas y el resto queda en el puntero.
  const emaPiPointers = new Map();
  const emaPiByAtc = new Map();
  const emaPiStats = { medicines: 0, withoutPdf: 0, extractError: 0, withoutAnnexI: 0, inCima: 0, notInCima: 0, pointers: 0, verifiedSections: 0, withheldSections: 0, fidelity: {}, smallDiffs: [] };
  if (!NO_EMA_PI && emaRaw) {
    const cimaNregs = new Set(inputs.products.map((p) => String(p.nregistro)));
    for (const r of emaRecords(emaRaw.rows).filter((x) => isHumanAuthorised(x) && x.atc5.length)) {
      emaPiStats.medicines++;
      const slug = emaPiSlug(r.url);
      const rowsPath = slug ? emaPiRowsPath(slug) : null;
      if (!rowsPath || !existsSync(rowsPath)) {
        emaPiStats.withoutPdf++;
        continue;
      }
      const rows = JSON.parse(readFileSync(rowsPath, 'utf8'));
      if (rows.error) {
        emaPiStats.extractError++;
        continue;
      }
      const smpcs = piSmpcsFromRows(rows);
      if (smpcs.length === 0) {
        emaPiStats.withoutAnnexI++;
        continue;
      }
      const inCima = smpcs.flatMap((sm) => sm.euNumbers.flatMap(cimaNregCandidates)).filter((n) => cimaNregs.has(n));
      if (inCima.length) {
        emaPiStats.inCima++;
        // Fidelidad: cada sección del PDF frente a la misma sección de la ficha de CIMA de ese nº de registro.
        const nreg = inCima.find((n) => existsSync(ftPath(n)));
        const doc = nreg ? readCimaDoc(nreg) : null;
        if (!doc) continue;
        const cimaText = new Map(cimaSections(doc.doc, { product: { nregistro: nreg } }, doc.retrievedAt).map((s) => [s.section.number, fidelityKey(s.text)]));
        const sm = smpcs.find((x) => x.euNumbers.some((eu) => cimaNregCandidates(eu).includes(nreg))) ?? smpcs[0];
        for (const s of piMonographSections(sm)) {
          if (!cimaText.has(s.number)) continue;
          const f = (emaPiStats.fidelity[s.number] ??= { compared: 0, identical: 0, verified: 0, verifiedIdentical: 0 });
          const same = cimaText.get(s.number) === fidelityKey(s.text);
          f.compared++;
          if (same) f.identical++;
          if (!isVerifiedSection(s)) continue;
          f.verified++;
          if (same) {
            f.verifiedIdentical++;
            continue;
          }
          // Diferencia de pocos caracteres en una sección verificada: candidata a error de extracción, se lista para revisarla.
          const d = keyDiff(cimaText.get(s.number), fidelityKey(s.text));
          if (d.a.length <= 4 && d.b.length <= 4) emaPiStats.smallDiffs.push({ medicine: r.name, nregistro: nreg, section: s.number, cima: d.a, pdf: d.b, context: cimaText.get(s.number).slice(Math.max(0, d.at - 30), d.at + 30) });
        }
        continue;
      }
      emaPiStats.notInCima++;
      const url = emaPiUrl(slug);
      const retrievedAt = retrievedAtOf(emaPiPdfPath(slug));
      for (const sm of smpcs) {
        const ptr = emaPiPointer(r, sm, { url, retrievedAt, license: EMA_LICENSE });
        const verified = piMonographSections(sm).filter(isVerifiedSection);
        emaPiStats.withheldSections += piMonographSections(sm).length - verified.length;
        for (const code of r.atc5) {
          if (!emaPiPointers.has(code)) emaPiPointers.set(code, []);
          emaPiPointers.get(code).push(ptr);
          emaPiStats.pointers++;
          if (!emaPiByAtc.has(code)) emaPiByAtc.set(code, []);
          for (const s of verified) emaPiByAtc.get(code).push(emaPiSection(r, sm, s, { url, retrievedAt, license: EMA_LICENSE }));
        }
      }
    }
  }

  const stats = { cimaDocsMissing: 0, cimaSectionsWithoutVersion: 0, cimaSectionsVersionUnpublished: 0, cimaDuplicateSections: 0, skippedWithoutData: 0, uniiWithoutLabel: 0, fdaRefsWithoutLabel: 0, fdaRefsWithoutMappedSections: 0, fdaSectionsWithoutVersion: 0 };
  const out = [];
  for (const [code, origin] of universe) {
    const cimaProducts = byAtc.get(code) ?? [];
    const sections = [];
    const safetyNotes = [];
    // Fichas de referencia primero; con `--granularity product`, después el resto de las fichas segmentadas.
    // Una sección cuyo texto ya está publicado para este ATC (misma clave y misma huella) no se repite:
    // se anota el nº de registro en `document.alsoIn` de la que quedó.
    const routeRefs = referenceDocuments(cimaProducts, 'route');
    const routeSet = new Set(routeRefs.map((r) => r.product.nregistro));
    const cimaRefs = GRANULARITY === 'product' ? [...routeRefs, ...referenceDocuments(cimaProducts, 'product').filter((r) => !routeSet.has(r.product.nregistro))] : routeRefs;
    const seenText = new Map();
    const seenNotes = new Set();
    for (const ref of cimaRefs) {
      const nreg = ref.product.nregistro;
      const read = readCimaDoc(nreg);
      if (!read) {
        stats.cimaDocsMissing++;
        continue;
      }
      for (const s of cimaSections(read.doc, ref, read.retrievedAt)) {
        if (!hasVersion(s)) {
          stats.cimaSectionsWithoutVersion++;
          continue;
        }
        const dupKey = `${s.key}|${s.textSha256}`;
        if (seenText.has(dupKey)) {
          const kept = seenText.get(dupKey);
          kept.document.alsoIn = [...(kept.document.alsoIn ?? []), s.document.id];
          stats.cimaDuplicateSections++;
          continue;
        }
        if (s.document.versionUnpublished) stats.cimaSectionsVersionUnpublished++;
        seenText.set(dupKey, s);
        sections.push(assertSection(s));
      }
      if (existsSync(notesPath(nreg))) {
        for (const n of cimaSafetyNotes(readJsonIfExists(notesPath(nreg)), ref.product, retrievedAtOf(notesPath(nreg)))) {
          const k = `${n.number ?? ''}|${n.reference ?? ''}|${n.url ?? ''}`;
          if (seenNotes.has(k)) continue;
          seenNotes.add(k);
          safetyNotes.push(n);
        }
      }
    }
    const bridge = bridges.get(code);
    const fdaPharmClasses = [];
    const refs = fda.refs.get(code) ?? [];
    if (bridge?.complete && refs.length === 0) stats.uniiWithoutLabel++;
    for (const ref of refs) {
      const hit = fda.labels.get(ref.identity.id);
      if (!hit) {
        stats.fdaRefsWithoutLabel++;
        continue;
      }
      const rows = openFdaSections(hit.label, ref, hit.retrievedAt);
      if (rows.length === 0) stats.fdaRefsWithoutMappedSections++;
      for (const s of rows) {
        if (hasVersion(s)) sections.push(assertSection(s));
        else stats.fdaSectionsWithoutVersion++;
      }
      const pc = openFdaPharmClasses(hit.label, hit.retrievedAt);
      if (pc) fdaPharmClasses.push(pc);
    }
    for (const s of emaByAtc.get(code) ?? []) if (hasVersion(s)) sections.push(assertSection(s));
    for (const s of lactmedByAtc.get(code)?.values() ?? []) if (hasVersion(s)) sections.push(assertSection(s));
    for (const s of livertoxByAtc.get(code)?.values() ?? []) if (hasVersion(s)) sections.push(assertSection(s));
    // EMA (PDF verificado): una sección cuyo texto, sin espacios, ya está en esta monografía con la misma clave no se repite.
    const present = new Set(sections.map((s) => `${s.key}|${comparisonKey(s.text)}`));
    for (const s of emaPiByAtc.get(code) ?? []) {
      const k = `${s.key}|${comparisonKey(s.text)}`;
      if (present.has(k) || !hasVersion(s)) continue;
      present.add(k);
      sections.push(assertSection(structuredClone(s)));
      emaPiStats.verifiedSections++;
    }
    const externalDocuments = [...(fda.pointers.get(code) ?? []), ...(emlRefsByAtc.get(code) ?? []), ...(emaPiPointers.get(code) ?? [])];
    if (cimaProducts.length === 0 && sections.length === 0 && externalDocuments.length === 0) {
      stats.skippedWithoutData++;
      continue;
    }
    const lin = liname.get(code);
    const fallbackName = lin ? { display: lin.presentations[0].name, source: 'liname-bo', language: 'es' } : gsrs ? gsrsDisplayFor(code, gsrs) : null;
    out.push({ ...buildMonograph({ code, names, cimaProducts, sections, safetyNotes, rxnorm: bridge, fdaPharmClasses, fallbackName, externalDocuments }), universeOrigin: origin });
  }

  await writeNdjson(OUTPUT.ndjson, out);
  const meta = {
    generatedAt: new Date().toISOString(),
    granularity: GRANULARITY,
    sources: [NO_CIMA ? 'sin CIMA' : 'CIMA', NO_EMA ? 'sin EMA' : 'EMA', NO_EML ? 'sin eEML' : 'eEML', NO_DAILYMED ? 'sin DailyMed' : 'DailyMed', NO_LACTMED ? 'sin LactMed' : 'LactMed', NO_LIVERTOX ? 'sin LiverTox' : 'LiverTox', NO_EMA_PI ? 'sin EMA PDF' : 'EMA PDF', 'openFDA', 'GSRS', 'RxNav'].join(', '),
    ema: emaStats,
    eml: emlStats,
    lactmed: lactmedStats,
    livertox: livertoxStats,
    emaPi: emaPiStats,
    universe: universe.size,
    monographs: out.length,
    sections: out.reduce((n, m) => n + m.sections.length, 0),
    sectionsBySource: out.flatMap((m) => m.sections).reduce((acc, s) => ({ ...acc, [s.source]: (acc[s.source] ?? 0) + 1 }), {}),
    cimaProductsWithoutAtc5: withoutAtc5.length,
    openFda: fda.link,
    gsrsIndex: gsrs ? { substances: gsrs.byUnii.size, atc5: gsrs.moietiesByAtc.size } : null,
    ...stats,
    segundos: Math.round((Date.now() - t0) / 1000),
  };
  writeJson(OUTPUT.meta, meta, true);
  console.log(JSON.stringify(meta, null, 2));
}

main().catch((err) => {
  console.error('ERROR FATAL en build-monographs:', err);
  process.exitCode = 1;
});
