// =============================================================================
// ANVISA (Brasil) · produtos para saúde → filas del formato común.
//
// Dos archivos del portal de datos abiertos (dados.anvisa.gov.br/dados/):
//   - `TA_PRODUTO_SAUDE_SITE.csv`   una línea por registro × fabricante
//   - `TA_PRODUTO_SAUDE_MODELO.csv` una línea por registro × fabricante × modelo
// Codificación windows-1252. Separador `;`, sin comillas que encierren campos (todas las líneas tienen el
// mismo número de `;`, verificado), así que se parte por `;` y no se interpretan
// las comillas sueltas que aparecen dentro de los nombres.
//
// Si se pasan `ctx.petitionsByProcess` (índice de las peticiones publicadas) y,
// para modelos, `ctx.processByRegistro` (registro → proceso del archivo de
// registros), cada fila lleva en `extra.anvisaPetitions` las áreas de interés y
// los asuntos que ANVISA publica para su proceso (p. ej. «Dispositivos Médicos
// para Diagnóstico in Vitro», «IVD - Registro de produto», «EQUIPAMENTO - …»).
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
  const registro = textOrNull(first.NUMERO_REGISTRO_CADASTRO);
  const ownProcess = textOrNull(first.NUMERO_PROCESSO);
  const siteProcess =
    ownProcess === null ? (ctx.processByRegistro?.get(registro) ?? null) : null;
  const processFromSite = siteProcess !== null;
  const processNumber = ownProcess ?? siteProcess;
  const petitions =
    processNumber === null
      ? null
      : (ctx.petitionsByProcess?.get(processNumber) ?? null);
  const extra = {
    holder: {
      name: holderName,
      ...(holderCnpj === null ? {} : { cnpj: holderCnpj }),
    },
    ...(processNumber === null ? {} : { processNumber }),
    ...(primary === null
      ? { manufacturerNameFrom: 'DETENTOR_REGISTRO_CADASTRO' }
      : {}),
    ...(primary?.countryName
      ? { manufacturerCountryName: primary.countryName }
      : {}),
    ...(manufacturers.length > 1
      ? { otherManufacturers: manufacturers.slice(1) }
      : {}),
    ...(processFromSite ? { processNumberFrom: 'TA_PRODUTO_SAUDE_SITE' } : {}),
    ...(petitions ? { anvisaPetitions: petitions } : {}),
    validity: textOrNull(first.VALIDADE_REGISTRO_CADASTRO),
    dataUpdatedAt: anvisaUpdateStamp(first.DT_ATUALIZACAO_DADO),
    ...(ctx.mirror ? { mirror: ctx.mirror } : {}),
    ...(ctx.officialFile ? { officialFile: ctx.officialFile } : {}),
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
export function* anvisaModelosRows(lines, ctx) {
  const key = (line) =>
    `${line.NUMERO_REGISTRO_CADASTRO.trim()}|${line.DS_MODELO_PRODUTO_MEDICO ?? ''}`;
  for (const [recordId, group] of groupBy(lines, key)) {
    yield makeRow({
      source: 'anvisa-produtos-modelos',
      sourceRecordId: recordId,
      model: textOrNull(group[0].DS_MODELO_PRODUTO_MEDICO),
      ...commonFields(group, ctx),
    });
  }
}

/**
 * Índice de las peticiones de ANVISA (`CICLO_ANALISE_PETICOES_*`) por número de
 * proceso: áreas de interés (`DESC_AREA_INTERESSE`) y asuntos de las peticiones
 * primarias (`DESC_ASSUNTO_PETICAO` con `S_N_PETICAO_PRIMARIA = S`). Es lo que
 * ANVISA publica sobre cada proceso; la unión con el registro es por número de
 * proceso exacto.
 */
export function addPetitionLine(index, line) {
  const process = textOrNull(line.NUM_PROCESSO_PETICAO);
  if (process === null) return;
  let entry = index.get(process);
  if (entry === undefined) {
    entry = { areas: new Set(), primarySubjects: new Set() };
    index.set(process, entry);
  }
  const area = textOrNull(line.DESC_AREA_INTERESSE);
  if (area !== null) entry.areas.add(area);
  const subject = textOrNull(line.DESC_ASSUNTO_PETICAO);
  if (subject !== null && line.S_N_PETICAO_PRIMARIA === 'S')
    entry.primarySubjects.add(subject);
}

/** Congela el índice en listas ordenadas (salida determinista). */
export function freezePetitionIndex(index) {
  const frozen = new Map();
  for (const [process, entry] of index)
    frozen.set(process, {
      areas: [...entry.areas].sort(),
      primarySubjects: [...entry.primarySubjects].sort(),
    });
  return frozen;
}
