// =============================================================================
// Registro de terminologías de enfermería: un concepto por terminología
// reconocida por la ANA, con los identificadores OFICIALES que publica HL7
// Terminology (THO) en su NamingSystem (OID y URI canónica), su descripción
// verbatim y el estado de licencia verificado (`licenses.mjs`).
//
// No carga el contenido de ninguna terminología: deja escrito, en la base, qué
// existe, cómo se identifica y por qué no está (licencia, host inaccesible).
// =============================================================================

import { ANA_RECOGNITION, CHECKED_AT, TERMINOLOGY_LICENSES } from './licenses.mjs';

export const REGISTRY_CODE_SYSTEM = 'nursing-terminology-registry';

/** Ids de NamingSystem de HL7 THO para las 12 terminologías reconocidas por la ANA. */
export const ANA_TERMINOLOGY_IDS = ['nanda-i', 'nic', 'noc', 'CCC', 'oms', 'pnds', 'icnp', 'v3-snomed-CT', 'v3-loinc', 'nmds', 'nmmds', 'abcCodes'];

/**
 * @param {Record<string, object>} namingSystems  NamingSystem de THO por id
 * @param {{ packageName: string, packageVersion: string, packageLicense: string, tarballUrl: string, retrievedAt: string, integrity: string }} pkg
 */
export function registryRows(namingSystems, pkg) {
  return ANA_TERMINOLOGY_IDS.map((id) => {
    const ns = namingSystems[id];
    if (!ns) throw new Error(`HL7 THO ${pkg.packageVersion}: falta NamingSystem-${id}.json`);
    const lic = TERMINOLOGY_LICENSES[id];
    if (!lic) throw new Error(`Sin licencia registrada para ${id}`);
    const oid = ns.uniqueId?.find((u) => u.type === 'oid')?.value ?? null;
    const uris = (ns.uniqueId ?? []).filter((u) => u.type === 'uri').map((u) => u.value);
    return {
      key: `registry:${id}`,
      codeSystem: REGISTRY_CODE_SYSTEM,
      code: id,
      kind: 'terminology',
      nameEs: null,
      nameOriginal: ns.title ?? ns.name,
      originalLanguage: 'en',
      descriptionOriginal: ns.description ?? null,
      hl7: {
        namingSystemUrl: ns.url,
        namingSystemVersion: ns.version ?? null,
        status: ns.status,
        kind: ns.kind,
        date: ns.date ?? null,
        publisher: ns.publisher ?? null,
        responsible: ns.responsible ?? null,
        oid,
        uris,
      },
      license: { ...lic, checkedAt: lic.checkedAt ?? CHECKED_AT },
      anaRecognition: ANA_RECOGNITION,
      provenance: {
        source: 'HL7 Terminology (THO), paquete npm',
        sourceId: `NamingSystem/${id}`,
        version: pkg.packageVersion,
        uri: ns.url,
        package: `${pkg.packageName}@${pkg.packageVersion}`,
        tarballUrl: pkg.tarballUrl,
        integrity: pkg.integrity,
        packageLicense: pkg.packageLicense,
      },
    };
  });
}
