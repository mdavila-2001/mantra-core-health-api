// =============================================================================
// Armado del corpus FHIR (THO + FHIR core R5/R4B/R4) desde los paquetes extraídos.
// Puro respecto de la red: lee `raw/x/<clave>/package/*.json`. Devuelve registros por capa
// y un informe de cobertura con TODO lo que no se cargó y por qué.
// =============================================================================

import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { SystemIndex, Unresolved, classifyLicense, expandValueSet, oidIndex, parseCodeSystem, valueSetInternalCode, vsState } from './fhir.mjs';

/** Orden de preferencia: la edición más nueva primero (la primera que se carga queda como versión por defecto). */
export const PACKAGE_ORDER = ['tho-r4', 'fhir-r5', 'fhir-r4b', 'fhir-r4'];

/**
 * Code systems que otro carril YA carga con la misma URL y versión (verificado en
 * tools/terminology-import/lab-tests/data/lab-tests-*.meta.json): no se duplican.
 * La clave es `url|versión`.
 */
export const LOADED_BY_OTHER_LANES = new Map([
  ['http://terminology.hl7.org/CodeSystem/v2-0487|3.0.0', 'lab-tests (hl7-v2-0487)'],
  ['http://terminology.hl7.org/CodeSystem/v2-0371|3.0.0', 'lab-tests (hl7-v2-0371)'],
  ['http://terminology.hl7.org/CodeSystem/v2-0488|3.0.0', 'lab-tests (hl7-v2-0488)'],
  ['http://terminology.hl7.org/CodeSystem/v2-0493|3.0.0', 'lab-tests (hl7-v2-0493)'],
  ['http://terminology.hl7.org/CodeSystem/v2-0074|3.0.0', 'lab-tests (hl7-v2-0074)'],
  ['http://terminology.hl7.org/CodeSystem/observation-category|2.0.0', 'lab-tests (hl7-observation-category)'],
]);

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');
const readResources = (pkgDir, prefix) =>
  readdirSync(pkgDir)
    .filter((f) => f.startsWith(`${prefix}-`) && f.endsWith('.json'))
    .sort()
    .map((f) => {
      const buf = readFileSync(join(pkgDir, f));
      return { file: f, sha256: sha256(buf), resource: JSON.parse(buf.toString('utf8')) };
    });

/**
 * @param {string} rawDir carpeta raw/ (con x/<clave>/package)
 * @param {Record<string, {sha256: string, retrievedAt: string, url: string, version: string, name: string}>} manifestFiles
 */
export function buildFhirCorpus(rawDir, manifestFiles) {
  const packages = PACKAGE_ORDER.map((key) => {
    const m = manifestFiles[key];
    if (!m) throw new Error(`falta ${key} en raw/manifest.json: corré fetch-sources.mjs`);
    return { key, name: m.name, version: m.version, file: `package/`, tarballSha256: m.sha256, tarballUrl: m.url, retrievedAt: m.retrievedAt, dir: join(rawDir, 'x', key, 'package') };
  });

  const coverage = { codeSystems: [], valueSets: [], oidsApplied: 0 };
  const acceptedCs = new Map(); // url|version → { meta, concepts, resourceSha, alsoIn }
  const oids = new Map();

  // --- CodeSystems ---
  for (const pkg of packages) {
    if (pkg.key === 'tho-r4') {
      for (const u of oidIndex(readResources(pkg.dir, 'NamingSystem').map((r) => r.resource))) if (!oids.has(u[0])) oids.set(u[0], u[1]);
    }
    for (const { file, sha256: resSha, resource } of readResources(pkg.dir, 'CodeSystem')) {
      const id = `${resource.url}|${resource.version ?? pkg.version}`;
      const row = { url: resource.url, version: resource.version ?? pkg.version, package: pkg.key, file, content: resource.content, status: resource.status ?? null };
      if (LOADED_BY_OTHER_LANES.has(id)) {
        coverage.codeSystems.push({ ...row, decision: 'omitido', reason: `ya lo carga ${LOADED_BY_OTHER_LANES.get(id)} con la misma URL y versión` });
        continue;
      }
      if (resource.content !== 'complete') {
        coverage.codeSystems.push({ ...row, decision: 'omitido', reason: `content=${resource.content}: no es un conjunto cerrado` });
        continue;
      }
      const lic = classifyLicense(resource);
      if (!lic.ok) {
        coverage.codeSystems.push({ ...row, decision: 'omitido', reason: `licencia: ${lic.reason}` });
        continue;
      }
      const prior = acceptedCs.get(id);
      const { meta, concepts } = parseCodeSystem(resource, { key: pkg.key, name: pkg.name, version: pkg.version, file: `package/${file}` });
      const contentSha = sha256(JSON.stringify({ concepts, c: meta.description, n: meta.name }));
      if (prior) {
        prior.alsoIn.push({ package: pkg.key, packageVersion: pkg.version, file: `package/${file}`, resourceSha256: resSha, sameContent: prior.contentSha === contentSha });
        coverage.codeSystems.push({ ...row, decision: 'duplicado', reason: `ya cargado desde ${prior.meta.packageKey}${prior.contentSha === contentSha ? ' (mismo contenido)' : ' (CONTENIDO DISTINTO: se conserva el primero)'}`, sameContent: prior.contentSha === contentSha });
        continue;
      }
      acceptedCs.set(id, { meta: { ...meta, oid: oids.get(meta.canonicalUrl) ?? null }, concepts, resourceSha256: resSha, contentSha, license: lic, alsoIn: [], package: pkg });
      coverage.codeSystems.push({ ...row, decision: 'cargado', reason: lic.reason, concepts: concepts.length });
    }
  }
  const systems = [...acceptedCs.values()];
  const internalCodes = new Map();
  for (const s of systems) {
    const k = `${s.meta.internalCode}`;
    const url = internalCodes.get(k);
    if (url && url !== s.meta.canonicalUrl) throw new Error(`internal_code repetido para dos URL: ${k}`);
    internalCodes.set(k, s.meta.canonicalUrl);
  }
  coverage.oidsApplied = systems.filter((s) => s.meta.oid).length;
  const index = new SystemIndex(systems);

  // --- ValueSets ---
  const vsSeen = new Map(); // url|version → { vs, pkg, file, sha, alsoIn }
  const vsByUrl = new Map(); // url → [entries en orden de preferencia]
  for (const pkg of packages) {
    for (const { file, sha256: resSha, resource } of readResources(pkg.dir, 'ValueSet')) {
      const id = `${resource.url}|${resource.version ?? pkg.version}`;
      const prior = vsSeen.get(id);
      if (prior) {
        prior.alsoIn.push({ package: pkg.key, file: `package/${file}`, resourceSha256: resSha, sameCompose: JSON.stringify(prior.resource.compose) === JSON.stringify(resource.compose) });
        continue;
      }
      const entry = { id, resource, pkg, file: `package/${file}`, resourceSha256: resSha, alsoIn: [], expansion: undefined };
      vsSeen.set(id, entry);
      if (!vsByUrl.has(resource.url)) vsByUrl.set(resource.url, []);
      vsByUrl.get(resource.url).push(entry);
    }
  }
  const resolving = new Set();
  const expandEntry = (entry) => {
    if (entry.expansion !== undefined) {
      if (entry.expansion instanceof Unresolved) throw entry.expansion;
      return entry.expansion;
    }
    if (resolving.has(entry.id)) throw new Unresolved(`referencia circular en ${entry.id}`);
    resolving.add(entry.id);
    try {
      const lic = classifyLicense(entry.resource);
      if (!lic.ok) throw new Unresolved(`licencia: ${lic.reason}`);
      const resolveRef = (canonical) => {
        const [url, version] = canonical.split('|');
        const list = vsByUrl.get(url);
        if (!list) return null;
        const hit = version ? list.find((e) => e.resource.version === version) : (list.find((e) => e.pkg.key === entry.pkg.key) ?? list[0]);
        return hit ? expandEntry(hit) : null;
      };
      entry.license = lic;
      entry.expansion = expandValueSet(index, entry.resource, entry.pkg.key, resolveRef);
      return entry.expansion;
    } catch (err) {
      if (!(err instanceof Unresolved)) throw err;
      entry.expansion = err;
      throw err;
    } finally {
      resolving.delete(entry.id);
    }
  };
  const valueSets = [];
  for (const entry of [...vsSeen.values()].sort((a, b) => (a.id < b.id ? -1 : 1))) {
    const r = entry.resource;
    const row = { url: r.url, version: r.version ?? entry.pkg.version, package: entry.pkg.key, file: entry.file };
    try {
      const members = expandEntry(entry);
      valueSets.push({ entry, members });
      coverage.valueSets.push({ ...row, decision: 'cargado', members: members.length });
    } catch (err) {
      if (!(err instanceof Unresolved)) throw err;
      coverage.valueSets.push({ ...row, decision: 'omitido', reason: err.message });
    }
  }
  return { packages, systems, valueSets, coverage, vsInternalCode: valueSetInternalCode, vsState };
}
