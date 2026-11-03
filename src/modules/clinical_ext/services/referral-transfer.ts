import { HttpStatus } from '@nestjs/common';
import { DomainException, ErrorCode } from '../../../common';
import { ClinicalExtErrorReason } from '../clinical_ext.error-reasons';
import type { Referrals } from '../entities';
import type {
  ArrivalCondition,
  DepartureCondition,
  ReferralTransferDto,
  ReferralTransferResponseDto,
  ReferralTransferVitalsDto,
  TransportMode,
} from '../dto/referral-transfer.dto';

/**
 * Reglas y proyección de los datos de traslado de una derivación (v4.2.74).
 *
 * Vive aparte de `referrals.service.ts` para que las reglas —puras, sin base—
 * se prueben solas y el servicio no crezca con ellas.
 */

/** Medios que sirven para un paciente inestable o crítico. */
const AMBULANCE_MODES: ReadonlySet<TransportMode> = new Set([
  'AMBULANCE_BASIC',
  'AMBULANCE_ADVANCED',
  'AIR_AMBULANCE',
]);

/** Estados al salir que exigen ambulancia, personal y aviso al receptor. */
const UNSAFE_CONDITIONS: ReadonlySet<DepartureCondition> = new Set([
  'UNSTABLE',
  'CRITICAL',
]);

/** Rangos de los signos vitales (CHECK del patch v4274). */
const VITAL_RANGES: Readonly<
  Record<
    Exclude<keyof ReferralTransferVitalsDto, 'recordedAt'>,
    readonly [number, number]
  >
> = {
  systolicBp: [40, 300],
  diastolicBp: [20, 200],
  heartRate: [20, 300],
  respiratoryRate: [4, 80],
  temperatureC: [30, 45],
  oxygenSaturation: [50, 100],
  glasgow: [3, 15],
};

/** Traslado efectivo: lo guardado combinado con lo que llega. */
export interface EffectiveTransfer {
  /** ¿Se traslada? */
  required: boolean | null;
  /** Medio. */
  transportMode: TransportMode | null;
  /** Detalle del medio. */
  transportDetail: string | null;
  /** Acompañante. */
  companionName: string | null;
  /** Parentesco. */
  companionRelationship: string | null;
  /** Teléfono. */
  companionPhone: string | null;
  /** Personal de salud. */
  escortProfessionalName: string | null;
  /** Rol del personal. */
  escortProfessionalRole: string | null;
  /** Estado al salir. */
  departureCondition: DepartureCondition | null;
  /** Toma de signos. */
  vitalsRecordedAt: Date | null;
  /** Sistólica. */
  systolicBp: number | null;
  /** Diastólica. */
  diastolicBp: number | null;
  /** Frecuencia cardiaca. */
  heartRate: number | null;
  /** Frecuencia respiratoria. */
  respiratoryRate: number | null;
  /** Temperatura. */
  temperatureC: number | null;
  /** Saturación. */
  oxygenSaturation: number | null;
  /** Glasgow. */
  glasgow: number | null;
  /** Aviso al receptor. */
  receiverContacted: boolean | null;
  /** Quién recibió el aviso. */
  receiverContactName: string | null;
  /** Cuándo. */
  receiverContactedAt: Date | null;
  /** Salida. */
  departedAt: Date | null;
}

/**
 * 400 de validación con `reason` estable y `details.fields`.
 *
 * @param reason - Sub-código estable.
 * @param message - Texto para humanos.
 * @param fields - Campos implicados (ruta en camelCase, p. ej. `vitals.glasgow`).
 * @returns La excepción.
 */
function invalidTransfer(
  reason: ClinicalExtErrorReason,
  message: string,
  fields: string[],
): DomainException {
  return new DomainException(
    HttpStatus.BAD_REQUEST,
    ErrorCode.VALIDATION_FAILED,
    message,
    { fields },
    reason,
  );
}

/** `undefined` conserva, `null` borra, otro valor reemplaza. */
function pick<T>(incoming: T | null | undefined, stored: T | null): T | null {
  return incoming === undefined ? stored : incoming;
}

/** Fecha ISO del cuerpo, o lo guardado si no vino. */
function pickDate(
  incoming: string | null | undefined,
  stored: Date | null,
): Date | null {
  if (incoming === undefined) return stored;
  return incoming === null ? null : new Date(incoming);
}

/** El número de una columna `numeric` (llega como texto). */
function toNumber(value: string | number | undefined | null): number | null {
  if (value === undefined || value === null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Combina el traslado guardado con el que llega.
 *
 * @param row - Derivación (o `undefined` al crear).
 * @param dto - Traslado recibido.
 * @returns El traslado efectivo sobre el que se evalúan las reglas.
 */
export function mergeTransfer(
  row: Referrals | undefined,
  dto: ReferralTransferDto,
): EffectiveTransfer {
  const v = dto.vitals === null ? clearedVitals() : (dto.vitals ?? {});
  return {
    required: pick(dto.required, row?.transferRequired ?? null),
    transportMode: pick(
      dto.transportMode,
      (row?.transportMode as TransportMode | undefined) ?? null,
    ),
    transportDetail: pick(dto.transportDetail, row?.transportDetail ?? null),
    companionName: pick(dto.companionName, row?.companionName ?? null),
    companionRelationship: pick(
      dto.companionRelationship,
      row?.companionRelationship ?? null,
    ),
    companionPhone: pick(dto.companionPhone, row?.companionPhone ?? null),
    escortProfessionalName: pick(
      dto.escortProfessionalName,
      row?.escortProfessionalName ?? null,
    ),
    escortProfessionalRole: pick(
      dto.escortProfessionalRole,
      row?.escortProfessionalRole ?? null,
    ),
    departureCondition: pick(
      dto.departureCondition,
      (row?.departureCondition as DepartureCondition | undefined) ?? null,
    ),
    vitalsRecordedAt: pickDate(v.recordedAt, row?.vitalsRecordedAt ?? null),
    systolicBp: pick(v.systolicBp, row?.vitalSystolicBp ?? null),
    diastolicBp: pick(v.diastolicBp, row?.vitalDiastolicBp ?? null),
    heartRate: pick(v.heartRate, row?.vitalHeartRate ?? null),
    respiratoryRate: pick(v.respiratoryRate, row?.vitalRespiratoryRate ?? null),
    temperatureC: pick(v.temperatureC, toNumber(row?.vitalTemperatureC)),
    oxygenSaturation: pick(
      v.oxygenSaturation,
      row?.vitalOxygenSaturation ?? null,
    ),
    glasgow: pick(v.glasgow, row?.vitalGlasgow ?? null),
    receiverContacted: pick(
      dto.receiverContacted,
      row?.receiverContacted ?? null,
    ),
    receiverContactName: pick(
      dto.receiverContactName,
      row?.receiverContactName ?? null,
    ),
    receiverContactedAt: pickDate(
      dto.receiverContactedAt,
      row?.receiverContactedAt ?? null,
    ),
    departedAt: pickDate(dto.departedAt, row?.departedAt ?? null),
  };
}

/** `vitals: null` borra todos los signos. */
function clearedVitals(): Required<ReferralTransferVitalsDto> {
  return {
    recordedAt: null,
    systolicBp: null,
    diastolicBp: null,
    heartRate: null,
    respiratoryRate: null,
    temperatureC: null,
    oxygenSaturation: null,
    glasgow: null,
  };
}

/**
 * Reglas del traslado (contrato §6.2), en este orden:
 *
 * 1. `TRANSFER_INCOMPLETE`: con `required=true`, `transportMode` y
 *    `departureCondition`.
 * 2. `TRANSFER_DETAIL_REQUIRED`: `transportMode=OTHER` sin `transportDetail`.
 * 3. `TRANSFER_VITALS_OUT_OF_RANGE`: rangos del patch y diastólica < sistólica.
 * 4. `TRANSFER_UNSAFE_TRANSPORT`: inestable o crítico exige ambulancia
 *    (básica, avanzada o aérea) y `escortProfessionalName`.
 * 5. `TRANSFER_RECEIVER_NOT_CONTACTED`: estado inestable o crítico exige
 *    `receiverContacted=true` y `receiverContactName`.
 *
 * La regla del aviso no mira la prioridad: el módulo no tiene un concepto de
 * prioridad urgente para derivaciones (sólo `CEXT.REFERRAL_PRIORITY_ROUTINE`)
 * y `priorityConceptId` no se acota a ningún catálogo, así que no hay con qué
 * reconocer una derivación urgente sin inventar un concepto.
 *
 * @param t - Traslado efectivo.
 * @throws DomainException 400 con el `reason` y `details.fields`.
 */
export function assertTransferRules(t: EffectiveTransfer): void {
  if (t.required === true) {
    const missing = (['transportMode', 'departureCondition'] as const).filter(
      (field) => !t[field],
    );
    if (missing.length > 0) {
      throw invalidTransfer(
        ClinicalExtErrorReason.TRANSFER_INCOMPLETE,
        'Un traslado necesita el medio de transporte y el estado del paciente al salir',
        missing.map((field) => `transfer.${field}`),
      );
    }
  }

  if (t.transportMode === 'OTHER' && !t.transportDetail?.trim()) {
    throw invalidTransfer(
      ClinicalExtErrorReason.TRANSFER_DETAIL_REQUIRED,
      'Con el medio «otro» hace falta el detalle del transporte',
      ['transfer.transportDetail'],
    );
  }

  const outOfRange = (
    Object.keys(VITAL_RANGES) as (keyof typeof VITAL_RANGES)[]
  ).filter((key) => {
    const value = t[key];
    const [min, max] = VITAL_RANGES[key];
    return value !== null && (value < min || value > max);
  });
  if (
    t.systolicBp !== null &&
    t.diastolicBp !== null &&
    t.diastolicBp >= t.systolicBp &&
    !outOfRange.includes('diastolicBp')
  ) {
    outOfRange.push('diastolicBp');
  }
  if (outOfRange.length > 0) {
    throw invalidTransfer(
      ClinicalExtErrorReason.TRANSFER_VITALS_OUT_OF_RANGE,
      'Hay signos vitales fuera de rango, o la diastólica no es menor que la sistólica',
      outOfRange.map((key) => `transfer.vitals.${key}`),
    );
  }

  const unsafe =
    t.departureCondition !== null &&
    UNSAFE_CONDITIONS.has(t.departureCondition);
  if (unsafe) {
    const fields: string[] = [];
    if (!t.transportMode || !AMBULANCE_MODES.has(t.transportMode)) {
      fields.push('transfer.transportMode');
    }
    if (!t.escortProfessionalName?.trim()) {
      fields.push('transfer.escortProfessionalName');
    }
    if (fields.length > 0) {
      throw invalidTransfer(
        ClinicalExtErrorReason.TRANSFER_UNSAFE_TRANSPORT,
        'Un paciente inestable o crítico se traslada en ambulancia y con personal de salud',
        fields,
      );
    }
  }

  if (unsafe) {
    const fields: string[] = [];
    if (t.receiverContacted !== true) fields.push('transfer.receiverContacted');
    if (!t.receiverContactName?.trim()) {
      fields.push('transfer.receiverContactName');
    }
    if (fields.length > 0) {
      throw invalidTransfer(
        ClinicalExtErrorReason.TRANSFER_RECEIVER_NOT_CONTACTED,
        'Con el paciente inestable o crítico hay que avisar antes al receptor',
        fields,
      );
    }
  }
}

/**
 * La llegada no puede ser anterior a la salida registrada.
 *
 * @param arrivedAt - Llegada.
 * @param departedAt - Salida guardada.
 * @throws DomainException 400 `TRANSFER_ARRIVAL_BEFORE_DEPARTURE`.
 */
export function assertArrivalAfterDeparture(
  arrivedAt: Date,
  departedAt: Date | undefined,
): void {
  if (departedAt && arrivedAt.getTime() < departedAt.getTime()) {
    throw invalidTransfer(
      ClinicalExtErrorReason.TRANSFER_ARRIVAL_BEFORE_DEPARTURE,
      'La llegada no puede ser anterior a la salida',
      ['arrivedAt'],
    );
  }
}

/**
 * Escribe el traslado efectivo en la fila.
 *
 * @param row - Derivación.
 * @param t - Traslado efectivo.
 */
export function applyTransfer(row: Referrals, t: EffectiveTransfer): void {
  const u = <T>(value: T | null): T | undefined => value ?? undefined;
  row.transferRequired = u(t.required);
  row.transportMode = u(t.transportMode);
  row.transportDetail = u(t.transportDetail);
  row.companionName = u(t.companionName);
  row.companionRelationship = u(t.companionRelationship);
  row.companionPhone = u(t.companionPhone);
  row.escortProfessionalName = u(t.escortProfessionalName);
  row.escortProfessionalRole = u(t.escortProfessionalRole);
  row.departureCondition = u(t.departureCondition);
  row.vitalsRecordedAt = u(t.vitalsRecordedAt);
  row.vitalSystolicBp = u(t.systolicBp);
  row.vitalDiastolicBp = u(t.diastolicBp);
  row.vitalHeartRate = u(t.heartRate);
  row.vitalRespiratoryRate = u(t.respiratoryRate);
  row.vitalTemperatureC =
    t.temperatureC === null ? undefined : t.temperatureC.toFixed(1);
  row.vitalOxygenSaturation = u(t.oxygenSaturation);
  row.vitalGlasgow = u(t.glasgow);
  row.receiverContacted = u(t.receiverContacted);
  row.receiverContactName = u(t.receiverContactName);
  row.receiverContactedAt = u(t.receiverContactedAt);
  row.departedAt = u(t.departedAt);
}

/**
 * Proyección del traslado de una fila.
 *
 * @param row - Derivación.
 * @returns El traslado, o `null` si la fila no tiene ningún dato de traslado.
 */
export function toTransferResponse(
  row: Referrals,
): ReferralTransferResponseDto | null {
  const n = <T>(value: T | undefined | null): T | null => value ?? null;
  const vitals = {
    recordedAt: n(row.vitalsRecordedAt),
    systolicBp: n(row.vitalSystolicBp),
    diastolicBp: n(row.vitalDiastolicBp),
    heartRate: n(row.vitalHeartRate),
    respiratoryRate: n(row.vitalRespiratoryRate),
    temperatureC: toNumber(row.vitalTemperatureC),
    oxygenSaturation: n(row.vitalOxygenSaturation),
    glasgow: n(row.vitalGlasgow),
  };
  const hasVitals = Object.values(vitals).some((value) => value !== null);
  const transfer: ReferralTransferResponseDto = {
    required: n(row.transferRequired),
    transportMode: n(row.transportMode as TransportMode | undefined),
    transportDetail: n(row.transportDetail),
    companionName: n(row.companionName),
    companionRelationship: n(row.companionRelationship),
    companionPhone: n(row.companionPhone),
    escortProfessionalName: n(row.escortProfessionalName),
    escortProfessionalRole: n(row.escortProfessionalRole),
    departureCondition: n(
      row.departureCondition as DepartureCondition | undefined,
    ),
    vitals: hasVitals ? vitals : null,
    receiverContacted: n(row.receiverContacted),
    receiverContactName: n(row.receiverContactName),
    receiverContactedAt: n(row.receiverContactedAt),
    departedAt: n(row.departedAt),
    arrivedAt: n(row.arrivedAt),
    arrivalCondition: n(row.arrivalCondition as ArrivalCondition | undefined),
    arrivalNotes: n(row.arrivalNotes),
  };
  const hasAny = Object.entries(transfer).some(
    ([key, value]) => key !== 'vitals' && value !== null,
  );
  return hasAny || hasVitals ? transfer : null;
}
