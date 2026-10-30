// =============================================================================
// CDSCO (India) · «List of Approved Devices» de https://cdscomdonline.gov.in/
// (`/NewMedDev/viewListOfApprovedDevices`, la misma respuesta JSON que dibuja
// la tabla de la página) → formato común.
//
// Cuatro listas: categoría (`categval` 1 = dispositivo médico, 2 = IVD) ×
// tipo de licencia (`selectFormType` 1 = importación, 2 = fabricación). Las de
// fabricación incluyen las licencias de las autoridades estatales («SLA - …»).
//
// - Una fila por permiso × dispositivo × marca × modelo × clase; id
//   `<md|ivd>|<formid>|<permissionid>|<dispositivo>|<marca>|<modelo>|<clase>`
//   (ids internos de la fuente y textos verbatim). Las copias repetidas se
//   juntan; si solo difieren en el uso previsto, los otros textos van en
//   `extra.otherIntendedUses`.
// - Tipo: nombre del dispositivo → `in:cdsco-device-name`; clase → `in:A`…`in:D`.
//   `extra.cdscoCategory` dice de qué lista vino (`md` o `ivd`).
// - Fabricante: en importación, el sitio legal de `premises_add` (o el real si
//   no hay legal), con país por la tabla cerrada `CDSCO_COUNTRY_ISO`. En
//   fabricación, el licenciatario (primera línea de `address`); país `IN` solo
//   si la dirección trae el «Pincode» de seis dígitos que escribe la fuente.
// - No se copian los campos de contacto («email:», «Contact Number:» y el
//   «Telephone No.»/«E-Mail» de los sitios) ni los correos escritos dentro de
//   la dirección. Un teléfono tecleado dentro de la dirección queda verbatim.
// =============================================================================

import { CDSCO_COUNTRY_ISO } from './cdsco.mjs';
import { isoDateOrNull, makeRow, textOrNull } from './row.mjs';

const MONTHS = {
  JAN: '01',
  FEB: '02',
  MAR: '03',
  APR: '04',
  MAY: '05',
  JUN: '06',
  JUL: '07',
  AUG: '08',
  SEP: '09',
  OCT: '10',
  NOV: '11',
  DEC: '12',
};

/** `Licence No: MFG/MD/2021/000123\nIssed On: 09-JAN-2018` → número y fecha. */
export function parseOfficialLicence(text) {
  const m =
    /^Licence no:\s*(.+?)\s*\n\s*Iss?u?ed on:\s*(\d{2})-([A-Z]{3})-(\d{4})\s*$/i.exec(
      String(text ?? '').trim(),
    );
  if (m === null) return null;
  const month = MONTHS[m[3].toUpperCase()];
  return {
    number: m[1],
    date: month ? isoDateOrNull(`${m[4]}-${month}-${m[2]}`) : null,
  };
}

/** Quita «email: …» y «Contact Number: …» de una dirección de licenciatario. */
export function withoutContacts(text) {
  return withoutEmails(String(text ?? '').split(/\s*email:/i)[0]);
}

/** Quita los correos que las empresas escriben dentro de una dirección. */
export function withoutEmails(text) {
  return textOrNull(
    String(text ?? '').replace(
      /\s*\(?\s*[\w.+-]+@[\w-]+(?:\.[\w-]+)+\s*\)?/g,
      '',
    ),
  );
}

/**
 * Sitios de `premises_add`: «Legal|Actual Manufacturing Site : M / s <razón
 * social>, \n<dirección>, \rCountry: <país>\rTelephone No.: …».
 */
export function parseOfficialSites(text) {
  const value = String(text ?? '');
  const marks = [
    ...value.matchAll(/(Legal|Actual) Manufacturing Site\s*:\s*/g),
  ];
  return marks.map((mark, i) => {
    const body = value.slice(
      mark.index + mark[0].length,
      i + 1 < marks.length ? marks[i + 1].index : value.length,
    );
    const m =
      /^M \/ s\s*([\s\S]+?),\s*\n([\s\S]*?)(?:,\s*)?\r?Country:\s*([^\r\n]*)/.exec(
        body,
      );
    const countryName = textOrNull(m?.[3]);
    return {
      role: mark[1].toLowerCase(),
      name: textOrNull(m?.[1]),
      address: withoutEmails(m?.[2]),
      countryName,
      country:
        countryName === null ? null : (CDSCO_COUNTRY_ISO[countryName] ?? null),
    };
  });
}

const nilToNull = (text) => {
  const value = textOrNull(text);
  return value === null || ['NIL', 'NA'].includes(value.toUpperCase())
    ? null
    : value;
};

/**
 * @param {{ category: 'md'|'ivd', records: object[] }[]} lists
 */
export function cdscoOfficialRows(lists, ctx) {
  const groups = new Map();
  for (const { category, records } of lists)
    for (const r of records) {
      const key = [
        category,
        r.formid,
        r.permissionid,
        r.devicename,
        r.brandname,
        r.modelname,
        r.classname,
      ].join('|');
      if (!groups.has(key)) groups.set(key, { category, records: [] });
      groups.get(key).records.push(r);
    }
  const rows = [];
  const stats = {
    inputRecords: 0,
    duplicates: 0,
    badLicence: 0,
    withoutManufacturer: 0,
  };
  for (const [key, { category, records }] of groups) {
    stats.inputRecords += records.length;
    stats.duplicates += records.length - 1;
    const r = records[0];
    const licence = parseOfficialLicence(r.str_licence_no);
    if (licence === null) {
      stats.badLicence += 1;
      continue;
    }
    const imported = r.licencetype === 'import';
    const sites = imported ? parseOfficialSites(r.premises_add) : [];
    const licensee = withoutContacts(r.address);
    const licenseeName = textOrNull(licensee?.split('\n')[0]);
    const primary = imported
      ? (sites.find((s) => s.role === 'legal' && s.name) ??
        sites.find((s) => s.name) ??
        null)
      : licenseeName === null
        ? null
        : {
            role: 'licensee',
            name: licenseeName,
            country: /Pincode:\s*\d{6}\b/.test(r.address ?? '') ? 'IN' : null,
            countryName: null,
          };
    if (primary === null) {
      stats.withoutManufacturer += 1;
      continue;
    }
    const classText = textOrNull(r.classname);
    const classMatch =
      classText === null ? null : /^Class ([A-D])$/.exec(classText);
    const uses = [
      ...new Set(records.map((x) => textOrNull(x.str_intended_use))),
    ].filter(Boolean);
    rows.push(
      makeRow({
        source: 'cdsco-approved-devices',
        sourceRecordId: key,
        sourceUrl: ctx.sourceUrl,
        sourceVersion: ctx.sourceVersion,
        retrievedAt: ctx.retrievedAt,
        deviceTypeCode: null,
        deviceTypeSystem:
          textOrNull(r.devicename) === null ? null : 'in:cdsco-device-name',
        deviceTypeName: textOrNull(r.devicename),
        manufacturerName: primary.name,
        manufacturerCountry: primary.country,
        manufacturerRegistryId: null,
        brandName: nilToNull(r.brandname),
        model: nilToNull(r.modelname),
        udiDi: null,
        riskClass: classMatch ? `in:${classMatch[1]}` : classText,
        authorizationId: licence.number,
        authorizationDate: licence.date,
        status: null,
        extra: {
          cdscoCategory: category,
          licenceType: textOrNull(r.licencetype),
          licenceForm: r.formno ?? null,
          issuingAuthority: textOrNull(r.instname),
          manufacturerRole: imported
            ? primary.role === 'legal'
              ? 'Legal Manufacturing Site'
              : 'Actual Manufacturing Site'
            : 'Manufacturing licensee',
          ...(primary.countryName
            ? { manufacturerCountryName: primary.countryName }
            : {}),
          ...(imported
            ? { manufacturingSites: sites, importer: licensee }
            : { licenseeAddress: licensee }),
          ...(uses.length > 0 ? { intendedUse: uses[0] } : {}),
          ...(uses.length > 1 ? { otherIntendedUses: uses.slice(1) } : {}),
          officialFile:
            ctx.officialFiles[category][imported ? 'import' : 'manufacturing'],
          officialPortal: ctx.officialPortal,
        },
      }),
    );
  }
  return { rows, stats };
}
