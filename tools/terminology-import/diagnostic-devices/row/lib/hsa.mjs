// =============================================================================
// HSA (Singapur) · Singapore Medical Device Register (SMDR) y base de clase A
// (data.gov.sg) → formato común.
//
// - SMDR (`Listing of Registered Medical Devices`, clases B–D): una fila por
//   número de registro. Tipo: `medical_speciality_area` (área de especialidad
//   que asigna HSA, p. ej. «Clinical Chemistry», «Immunology», «Radiology») →
//   `sg:hsa-speciality`. Clase `CLASS B` → `sg:B`. Fabricante: el titular del
//   producto (`product_owner_name`); el registrante local en `extra.registrant`.
//   Los modelos vienen como listas dentro de un texto (`model_name`,
//   `model_identifier`): se guardan verbatim en `extra`, sin partirlos.
// - Clase A (`Class A Medical Devices`): una fila por dispositivo notificado
//   (notificación + nombre + UDI-DI), con titular, distribuidor y UDI-DI.
// El país del titular solo aparece dentro de la dirección: queda en null.
// =============================================================================

import { makeRow, textOrNull } from './row.mjs';

/** `20/05/2026 01:04` (dd/mm/aaaa) → `2026-05-20`; también `9/3/2018 14:38`. */
export function hsaDate(value) {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(String(value ?? '').trim());
  if (m === null) return null;
  const iso = `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  const date = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== iso
    ? null
    : iso;
}

/** HSA escribe «-», «NA» o «NOT_GENERATED» cuando no hay valor. */
export function hsaText(value) {
  const text = textOrNull(value);
  return text === null ||
    text === '-' ||
    text === 'NA' ||
    text === 'NOT_GENERATED'
    ? null
    : text;
}

export function smdrRows(lines, ctx) {
  const rows = [];
  const seen = new Set();
  const stats = { withoutRegistration: 0, withoutOwner: 0, duplicates: 0 };
  for (const line of lines) {
    const registration = hsaText(line.device_registration_number);
    if (registration === null) {
      stats.withoutRegistration += 1;
      continue;
    }
    if (seen.has(registration)) {
      stats.duplicates += 1;
      continue;
    }
    seen.add(registration);
    const owner = hsaText(line.product_owner_name);
    if (owner === null) {
      stats.withoutOwner += 1;
      continue;
    }
    const klass = /^CLASS ([A-D])$/.exec(
      textOrNull(line.medical_device_class) ?? '',
    );
    const area = hsaText(line.medical_speciality_area);
    rows.push(
      makeRow({
        source: 'hsa-smdr',
        sourceRecordId: registration,
        sourceUrl: ctx.sourceUrl,
        sourceVersion: ctx.sourceVersion,
        retrievedAt: ctx.retrievedAt,
        deviceTypeCode: null,
        deviceTypeSystem: area === null ? null : 'sg:hsa-speciality',
        deviceTypeName: area,
        manufacturerName: owner,
        manufacturerCountry: null,
        manufacturerRegistryId: null,
        brandName: hsaText(line.device_name),
        model: null,
        udiDi: null,
        riskClass: klass
          ? `sg:${klass[1]}`
          : textOrNull(line.medical_device_class),
        authorizationId: registration,
        authorizationDate: hsaDate(line.registration_date),
        status: null,
        extra: {
          ...(hsaText(line.description)
            ? { description: hsaText(line.description) }
            : {}),
          ...(hsaText(line.model_name)
            ? { modelNames: hsaText(line.model_name) }
            : {}),
          ...(hsaText(line.model_identifier)
            ? { modelIdentifiers: hsaText(line.model_identifier) }
            : {}),
          ...(hsaDate(line.change_notification_approval_date)
            ? {
                changeNotificationApprovedOn: hsaDate(
                  line.change_notification_approval_date,
                ),
              }
            : {}),
          ...(hsaText(line.product_owner_address)
            ? { manufacturerAddress: hsaText(line.product_owner_address) }
            : {}),
          registrant: {
            name: hsaText(line.registrant_name),
            address: hsaText(line.registrant_address),
          },
          manufacturerRole: 'product owner',
          officialFile: ctx.officialFile,
          officialPortal: ctx.officialPortal,
        },
      }),
    );
  }
  return { rows, stats };
}

/** Generador: la base de clase A tiene más de un millón de líneas. */
export function* hsaClassARows(lines, ctx, stats = {}) {
  stats.withoutOwner = 0;
  stats.duplicates = 0;
  const seen = new Set();
  for (const line of lines) {
    const notification = hsaText(line.notification_number);
    if (notification === null) continue;
    // Una notificación puede cubrir varios dispositivos: la clave es
    // notificación + nombre + UDI-DI, única en la fuente.
    const id = `${notification}|${line.device_name ?? ''}|${line.udi_di ?? ''}`;
    if (seen.has(id)) {
      stats.duplicates += 1;
      continue;
    }
    seen.add(id);
    const owner = hsaText(line.product_owner_name);
    if (owner === null) {
      stats.withoutOwner += 1;
      continue;
    }
    yield makeRow({
      source: 'hsa-class-a',
      sourceRecordId: id,
      sourceUrl: ctx.sourceUrl,
      sourceVersion: ctx.sourceVersion,
      retrievedAt: ctx.retrievedAt,
      deviceTypeCode: null,
      deviceTypeSystem: null,
      deviceTypeName: null,
      manufacturerName: owner,
      manufacturerCountry: null,
      manufacturerRegistryId: null,
      brandName: hsaText(line.device_name),
      model: null,
      udiDi: hsaText(line.udi_di),
      riskClass: 'sg:A',
      authorizationId: notification,
      authorizationDate: null,
      status: null,
      extra: {
        ...(hsaText(line.description)
          ? { description: hsaText(line.description) }
          : {}),
        ...(hsaText(line.device_identifier)
          ? { deviceIdentifier: hsaText(line.device_identifier) }
          : {}),
        ...(hsaText(line.dm_di) ? { dmDi: hsaText(line.dm_di) } : {}),
        ...(hsaText(line.sterile_nonsterile)
          ? { sterility: hsaText(line.sterile_nonsterile) }
          : {}),
        dealer: {
          name: hsaText(line.dealer_name),
          licence: hsaText(line.dealer_license_number),
          licenceType: hsaText(line.license_type),
        },
        manufacturerRole: 'product owner',
        officialFile: ctx.officialFile,
        officialPortal: ctx.officialPortal,
      },
    });
  }
}
