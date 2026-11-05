import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

/**
 * Datos de traslado de una derivación (v4.2.74, brecha B8).
 *
 * Base normativa: Norma Nacional de Referencia y Contrarreferencia (MSD
 * Bolivia, 2.ª ed. 2013). El formulario de referencia registra el medio de
 * transporte, quién acompaña, los signos vitales y el estado del paciente al
 * salir, y la comunicación previa con el establecimiento receptor; el receptor
 * anota la llegada y el estado en que llegó.
 *
 * Los rangos de los signos vitales no se validan con decoradores sino en el
 * servicio (`referral-transfer.ts`): así el 400 lleva el `reason` estable
 * `TRANSFER_VITALS_OUT_OF_RANGE` y los campos en `details.fields`.
 */

/** Medios de transporte (CHECK `ck_referrals_transport_mode`). */
export const TRANSPORT_MODES = [
  'AMBULANCE_BASIC',
  'AMBULANCE_ADVANCED',
  'AIR_AMBULANCE',
  'RIVER',
  'PRIVATE_VEHICLE',
  'PUBLIC_TRANSPORT',
  'ON_FOOT',
  'OTHER',
] as const;

/** Medio de transporte del traslado. */
export type TransportMode = (typeof TRANSPORT_MODES)[number];

/** Estado del paciente al salir (CHECK `ck_referrals_departure_condition`). */
export const DEPARTURE_CONDITIONS = ['STABLE', 'UNSTABLE', 'CRITICAL'] as const;

/** Estado del paciente al salir. */
export type DepartureCondition = (typeof DEPARTURE_CONDITIONS)[number];

/** Estado del paciente al llegar (CHECK `ck_referrals_arrival_condition`). */
export const ARRIVAL_CONDITIONS = [
  'STABLE',
  'UNSTABLE',
  'CRITICAL',
  'DECEASED',
] as const;

/** Estado del paciente al llegar. */
export type ArrivalCondition = (typeof ARRIVAL_CONDITIONS)[number];

/** Signos vitales al referir. */
export class ReferralTransferVitalsDto {
  /** Momento de la toma. */
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  @IsOptional()
  @IsISO8601()
  recordedAt?: string | null;

  /** Presión sistólica (mmHg), 40–300. */
  @ApiPropertyOptional({
    type: Number,
    minimum: 40,
    maximum: 300,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  systolicBp?: number | null;

  /** Presión diastólica (mmHg), 20–200 y menor que la sistólica. */
  @ApiPropertyOptional({
    type: Number,
    minimum: 20,
    maximum: 200,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  diastolicBp?: number | null;

  /** Frecuencia cardiaca (lpm), 20–300. */
  @ApiPropertyOptional({
    type: Number,
    minimum: 20,
    maximum: 300,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  heartRate?: number | null;

  /** Frecuencia respiratoria (rpm), 4–80. */
  @ApiPropertyOptional({
    type: Number,
    minimum: 4,
    maximum: 80,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  respiratoryRate?: number | null;

  /** Temperatura (°C), 30.0–45.0, un decimal. */
  @ApiPropertyOptional({
    type: Number,
    minimum: 30,
    maximum: 45,
    nullable: true,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 })
  temperatureC?: number | null;

  /** Saturación de oxígeno (%), 50–100. */
  @ApiPropertyOptional({
    type: Number,
    minimum: 50,
    maximum: 100,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  oxygenSaturation?: number | null;

  /** Escala de Glasgow, 3–15. */
  @ApiPropertyOptional({
    type: Number,
    minimum: 3,
    maximum: 15,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  glasgow?: number | null;
}

/**
 * Datos de salida del traslado: el objeto `transfer` de `POST /referrals` y el
 * cuerpo de `PATCH /referrals/{id}/transfer`.
 *
 * En el PATCH un campo omitido conserva lo guardado y un `null` lo borra; las
 * reglas se evalúan sobre el resultado de esa combinación.
 */
export class ReferralTransferDto {
  /** ¿El paciente se traslada físicamente? */
  @ApiPropertyOptional({ type: Boolean, nullable: true })
  @IsOptional()
  @IsBoolean()
  required?: boolean | null;

  /** Medio de transporte. */
  @ApiPropertyOptional({ enum: TRANSPORT_MODES, nullable: true })
  @IsOptional()
  @IsIn(TRANSPORT_MODES)
  transportMode?: TransportMode | null;

  /** Placa o identificación de la unidad, o el detalle de `OTHER`. */
  @ApiPropertyOptional({ type: String, maxLength: 200, nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  transportDetail?: string | null;

  /** Familiar o acompañante. */
  @ApiPropertyOptional({ type: String, maxLength: 200, nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  companionName?: string | null;

  /** Parentesco del acompañante. */
  @ApiPropertyOptional({ type: String, maxLength: 80, nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  companionRelationship?: string | null;

  /** Teléfono del acompañante. */
  @ApiPropertyOptional({ type: String, maxLength: 40, nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  companionPhone?: string | null;

  /** Personal de salud que acompaña. */
  @ApiPropertyOptional({ type: String, maxLength: 200, nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  escortProfessionalName?: string | null;

  /** Rol del personal que acompaña (médico, enfermería, paramédico…). */
  @ApiPropertyOptional({ type: String, maxLength: 80, nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  escortProfessionalRole?: string | null;

  /** Estado del paciente al salir. */
  @ApiPropertyOptional({ enum: DEPARTURE_CONDITIONS, nullable: true })
  @IsOptional()
  @IsIn(DEPARTURE_CONDITIONS)
  departureCondition?: DepartureCondition | null;

  /** Signos vitales al referir. */
  @ApiPropertyOptional({ type: ReferralTransferVitalsDto, nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => ReferralTransferVitalsDto)
  vitals?: ReferralTransferVitalsDto | null;

  /** ¿Se avisó al receptor antes de salir? */
  @ApiPropertyOptional({ type: Boolean, nullable: true })
  @IsOptional()
  @IsBoolean()
  receiverContacted?: boolean | null;

  /** Quién recibió el aviso. */
  @ApiPropertyOptional({ type: String, maxLength: 200, nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  receiverContactName?: string | null;

  /** Cuándo se avisó al receptor. */
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  @IsOptional()
  @IsISO8601()
  receiverContactedAt?: string | null;

  /** Salida. */
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  @IsOptional()
  @IsISO8601()
  departedAt?: string | null;
}

/** Cuerpo de `PATCH /referrals/{id}/arrival`: lo registra el destino. */
export class ReferralArrivalDto {
  /** Llegada. */
  @ApiProperty({ type: String, format: 'date-time' })
  @IsISO8601()
  arrivedAt!: string;

  /** Estado del paciente al llegar. */
  @ApiProperty({ enum: ARRIVAL_CONDITIONS })
  @IsIn(ARRIVAL_CONDITIONS)
  arrivalCondition!: ArrivalCondition;

  /** Observaciones de la llegada. */
  @ApiPropertyOptional({ maxLength: 4000 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  arrivalNotes?: string;
}

/** Signos vitales tal como se devuelven. */
export class ReferralTransferVitalsResponseDto {
  /** Momento de la toma. */
  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  recordedAt!: Date | null;

  /** Presión sistólica (mmHg). */
  @ApiProperty({ type: Number, nullable: true })
  systolicBp!: number | null;

  /** Presión diastólica (mmHg). */
  @ApiProperty({ type: Number, nullable: true })
  diastolicBp!: number | null;

  /** Frecuencia cardiaca (lpm). */
  @ApiProperty({ type: Number, nullable: true })
  heartRate!: number | null;

  /** Frecuencia respiratoria (rpm). */
  @ApiProperty({ type: Number, nullable: true })
  respiratoryRate!: number | null;

  /** Temperatura (°C). */
  @ApiProperty({ type: Number, nullable: true })
  temperatureC!: number | null;

  /** Saturación de oxígeno (%). */
  @ApiProperty({ type: Number, nullable: true })
  oxygenSaturation!: number | null;

  /** Escala de Glasgow. */
  @ApiProperty({ type: Number, nullable: true })
  glasgow!: number | null;
}

/** Traslado de una derivación tal como se devuelve. */
export class ReferralTransferResponseDto {
  /** ¿El paciente se traslada físicamente? */
  @ApiProperty({ type: Boolean, nullable: true })
  required!: boolean | null;

  /** Medio de transporte. */
  @ApiProperty({ enum: TRANSPORT_MODES, nullable: true })
  transportMode!: TransportMode | null;

  /** Placa, unidad o detalle de `OTHER`. */
  @ApiProperty({ type: String, nullable: true })
  transportDetail!: string | null;

  /** Acompañante. */
  @ApiProperty({ type: String, nullable: true })
  companionName!: string | null;

  /** Parentesco del acompañante. */
  @ApiProperty({ type: String, nullable: true })
  companionRelationship!: string | null;

  /** Teléfono del acompañante. */
  @ApiProperty({ type: String, nullable: true })
  companionPhone!: string | null;

  /** Personal de salud que acompaña. */
  @ApiProperty({ type: String, nullable: true })
  escortProfessionalName!: string | null;

  /** Rol del personal que acompaña. */
  @ApiProperty({ type: String, nullable: true })
  escortProfessionalRole!: string | null;

  /** Estado al salir. */
  @ApiProperty({ enum: DEPARTURE_CONDITIONS, nullable: true })
  departureCondition!: DepartureCondition | null;

  /** Signos vitales, o `null` si no se tomó ninguno. */
  @ApiProperty({ type: ReferralTransferVitalsResponseDto, nullable: true })
  vitals!: ReferralTransferVitalsResponseDto | null;

  /** ¿Se avisó al receptor? */
  @ApiProperty({ type: Boolean, nullable: true })
  receiverContacted!: boolean | null;

  /** Quién recibió el aviso. */
  @ApiProperty({ type: String, nullable: true })
  receiverContactName!: string | null;

  /** Cuándo se avisó. */
  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  receiverContactedAt!: Date | null;

  /** Salida. */
  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  departedAt!: Date | null;

  /** Llegada (la registra el destino). */
  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  arrivedAt!: Date | null;

  /** Estado al llegar. */
  @ApiProperty({ enum: ARRIVAL_CONDITIONS, nullable: true })
  arrivalCondition!: ArrivalCondition | null;

  /** Observaciones de la llegada. */
  @ApiProperty({ type: String, nullable: true })
  arrivalNotes!: string | null;
}
