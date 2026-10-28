// =============================================================================
// ANVISA (Brasil) · produtos para saúde → filas del formato común.
//
// Dos archivos del portal de datos abiertos, leídos de espejos:
//   - registros (una línea por registro × fabricante), corte 2025-06-17
//   - modelos   (una línea por registro × fabricante × modelo), corte 2020-12-25
// Separador `;`, sin comillas que encierren campos (todas las líneas tienen el
// mismo número de `;`, verificado), así que se parte por `;` y no se interpretan
// las comillas sueltas que aparecen dentro de los nombres.
//
// Fabricante: `NOME_FABRICANTE`. Si un registro no trae ninguno, va el titular
// (`DETENTOR_REGISTRO_CADASTRO`) y se marca `extra.manufacturerNameFrom`.
// El CNPJ publicado es del titular: solo pasa a `manufacturerRegistryId` si el
// fabricante es literalmente la misma razón social.
// =============================================================================

import { ANVISA_COUNTRY_ISO, dmyToIso, makeRow, textOrNull } from './row.mjs';

/** Parte el texto en objetos por encabezado; falla si una línea no tiene las columnas esperadas. */
export function splitSemicolonCsv(text) {
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const lines = src.split(/\r?\n/).filter((line) => line.trim() !== '');
  const header = lines[0].split(';');
  return lines.slice(1).map((line, index) => {
    const cells = line.split(';');
    if (cells.length !== header.length)
      throw new Error(
        `línea ${index + 2}: ${cells.length} columnas, se esperaban ${header.length}`,
      );
    return Object.fromEntries(header.map((name, i) => [name, cells[i]]));
  });
}

/** `06/17/2025 19:00:01` (mm/dd/aaaa) → `2025-06-17T19:00:01`. */
export function anvisaUpdateStamp(value) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}:\d{2}:\d{2})$/.exec(
    String(value ?? '').trim(),
  );
  return m === null ? null : `${m[3]}-${m[1]}-${m[2]}T${m[4]}`;
}

function manufacturerOf(line) {
  const name = textOrNull(line.NOME_FABRICANTE);
  if (name === null) return null;
  const countryName = textOrNull(line.NOME_PAIS_FABRIC);
  return {
    name,
    countryName,
    country:
      countryName === null ? null : (ANVISA_COUNTRY_ISO[countryName] ?? null),
  };
}

/** Agrupa líneas por clave conservando el orden de aparición. */
function groupBy(lines, keyOf) {
  const groups = new Map();
  for (const line of lines) {
    const key = keyOf(line);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(line);
  }
  return groups;
}

function uniqueManufacturers(lines) {
  const seen = new Map();
  for (const line of lines) {
    const m = manufacturerOf(line);
    if (m !== null && !seen.has(`${m.name}|${m.countryName}`))
      seen.set(`${m.name}|${m.countryName}`, m);
  }
  return [...seen.values()];
}

function commonFields(lines, ctx) {
  const first = lines[0];
  const manufacturers = uniqueManufacturers(lines);
  const holderName = textOrNull(first.DETENTOR_REGISTRO_CADASTRO);
  const holderCnpj = textOrNull(first.CNPJ_DETENTOR_REGISTRO_CADASTRO);
  const primary = manufacturers[0] ?? null;
  const manufacturerName = primary?.name ?? holderName;
  const extra = {
    holder: {
      name: holderName,
      ...(holderCnpj === null ? {} : { cnpj: holderCnpj }),
    },
    ...(textOrNull(first.NUMERO_PROCESSO) === null
      ? {}
      : { processNumber: textOrNull(first.NUMERO_PROCESSO) }),
    ...(primary === null
      ? { manufacturerNameFrom: 'DETENTOR_REGISTRO_CADASTRO' }
      : {}),
    ...(primary?.countryName
      ? { manufacturerCountryName: primary.countryName }
      : {}),
    ...(manufacturers.length > 1
      ? { otherManufacturers: manufacturers.slice(1) }
      : {}),
    validity: textOrNull(first.VALIDADE_REGISTRO_CADASTRO),
    dataUpdatedAt: anvisaUpdateStamp(first.DT_ATUALIZACAO_DADO),
    ...(ctx.mirror ? { mirror: ctx.mirror } : {}),
    ...(ctx.official ? { official: ctx.official } : {}),
    officialPortal: ctx.officialPortal,
  };
  const classe = textOrNull(first.CLASSE_RISCO);
  return {
    sourceUrl: ctx.sourceUrl,
    sourceVersion: ctx.sourceVersion,
    retrievedAt: ctx.retrievedAt,
    deviceTypeCode: null,
    deviceTypeSystem:
      textOrNull(first.NOME_TECNICO) === null ? null : 'br:anvisa-nome-tecnico',
    deviceTypeName: textOrNull(first.NOME_TECNICO),
    manufacturerName,
    manufacturerCountry: primary?.country ?? null,
    manufacturerRegistryId:
      holderCnpj !== null && manufacturerName === holderName
        ? `cnpj:${holderCnpj}`
        : null,
    brandName: textOrNull(first.NOME_COMERCIAL),
    udiDi: null,
    riskClass: classe === null ? null : `br:${classe}`,
    authorizationId: textOrNull(first.NUMERO_REGISTRO_CADASTRO),
    authorizationDate: dmyToIso(first.DT_PUB_REGISTRO_CADASTRO),
    // VALIDADE_REGISTRO_CADASTRO verbatim: «VIGENTE» o la fecha de vencimiento.
    status: textOrNull(first.VALIDADE_REGISTRO_CADASTRO),
    extra,
  };
}

/** Archivo de registros → una fila por número de registro. */
export function anvisaProdutosRows(lines, ctx) {
  const rows = [];
  for (const [registro, group] of groupBy(lines, (line) =>
    line.NUMERO_REGISTRO_CADASTRO.trim(),
  )) {
    rows.push(
      makeRow({
        source: 'anvisa-produtos',
        sourceRecordId: registro,
        model: null,
        ...commonFields(group, ctx),
      }),
    );
  }
  return rows;
}

/** Archivo de modelos → una fila por registro + modelo (texto verbatim). */
export function anvisaModelosRows(lines, ctx) {
  const rows = [];
  const key = (line) =>
    `${line.NUMERO_REGISTRO_CADASTRO.trim()}|${line.DS_MODELO_PRODUTO_MEDICO ?? ''}`;
  for (const [recordId, group] of groupBy(lines, key)) {
    rows.push(
      makeRow({
        source: 'anvisa-produtos-modelos',
        sourceRecordId: recordId,
        model: textOrNull(group[0].DS_MODELO_PRODUTO_MEDICO),
        ...commonFields(group, ctx),
      }),
    );
  }
  return rows;
}
