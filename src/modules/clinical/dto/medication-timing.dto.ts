import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';
import {
  DEFAULT_MEDICATION_TIME_ZONE,
  isValidTimeZone,
  MEDICATION_PERIOD_UNITS,
  TIME_OF_DAY_PATTERN,
  type MedicationPeriodUnit,
} from '../services/medication-schedule';

/** Tope de horas del día declarables: más de 12 tomas diarias no es una posología de recordatorio. */
export const TIMES_OF_DAY_MAX = 12;

/** Tope de tomas por período. */
export const TIMING_FREQUENCY_MAX = 48;

/** Tope del período (365 días, 8760 horas o 52 semanas caben de sobra). */
export const TIMING_PERIOD_MAX = 8760;

/** Tope de la duración del tratamiento en días. */
export const TIMING_DURATION_DAYS_MAX = 3650;

/** Campos del objeto `timing` que programan tomas. */
type ScheduleField = 'frequency' | 'period' | 'periodUnit' | 'timesOfDay';

/** El valor está presente (ni `undefined` ni `null`). */
function present(value: unknown): boolean {
  return value !== undefined && value !== null;
}

/**
 * Exige que, si la propiedad viaja, viajen también las hermanas nombradas.
 * La frecuencia, el período y su unidad sólo significan algo juntos.
 */
function RequiresTogether(
  siblings: ScheduleField[],
  options?: ValidationOptions,
): PropertyDecorator {
  return (target, propertyName) => {
    registerDecorator({
      name: 'requiresTogether',
      target: target.constructor,
      propertyName: propertyName.toString(),
      constraints: siblings,
      options: {
        message: `${propertyName.toString()} exige también ${siblings.join(' y ')}`,
        ...options,
      },
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          if (!present(value)) return true;
          const object = args.object as Record<string, unknown>;
          return siblings.every((sibling) => present(object[sibling]));
        },
      },
    });
  };
}

/**
 * Rechaza la propiedad si alguna de las nombradas también viaja. `asNeeded`
 * cuenta sólo cuando es `true`.
 */
function ExcludesFields(
  others: (ScheduleField | 'asNeeded')[],
  options?: ValidationOptions,
): PropertyDecorator {
  return (target, propertyName) => {
    registerDecorator({
      name: 'excludesFields',
      target: target.constructor,
      propertyName: propertyName.toString(),
      constraints: others,
      options: {
        message: `${propertyName.toString()} es excluyente con ${others.join(', ')}`,
        ...options,
      },
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          if (!present(value)) return true;
          const object = args.object as Record<string, unknown>;
          return others.every((other) =>
            other === 'asNeeded'
              ? object.asNeeded !== true
              : !present(object[other]),
          );
        },
      },
    });
  };
}

/** Zona horaria IANA existente en el runtime. */
function IsIanaTimeZone(options?: ValidationOptions): PropertyDecorator {
  return (target, propertyName) => {
    registerDecorator({
      name: 'isIanaTimeZone',
      target: target.constructor,
      propertyName: propertyName.toString(),
      options: {
        message: `${propertyName.toString()} debe ser una zona horaria IANA (p. ej. ${DEFAULT_MEDICATION_TIME_ZONE})`,
        ...options,
      },
      validator: {
        validate(value: unknown): boolean {
          return typeof value === 'string' && isValidTimeZone(value);
        },
      },
    });
  };
}

/**
 * Posología estructurada de una receta (patch v4.2.35): subconjunto de FHIR
 * `Timing.repeat`.
 *
 * Tres formas, excluyentes entre sí: `asNeeded: true` (PRN, sin tomas
 * programadas), `frequency` + `period` + `periodUnit` («3 veces por día»), o
 * `timesOfDay` («08:00», «20:00»). No reemplaza a `frequencyText`, que sigue
 * siendo lo que se imprime y se firma: esto es lo que alimenta el
 * recordatorio y el .ics.
 */
export class MedicationTimingDto {
  /** PRN / «según necesidad». */
  @ApiPropertyOptional({
    description:
      'Según necesidad (PRN): sin tomas programadas, sin recordatorios. Excluye frequency y timesOfDay',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  asNeeded?: boolean;

  /** Tomas por período. */
  @ApiPropertyOptional({
    description:
      'Tomas por período (FHIR repeat.frequency). Exige period y periodUnit',
    minimum: 1,
    maximum: TIMING_FREQUENCY_MAX,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(TIMING_FREQUENCY_MAX)
  @RequiresTogether(['period', 'periodUnit'])
  @ExcludesFields(['asNeeded', 'timesOfDay'])
  frequency?: number;

  /** Longitud del período. */
  @ApiPropertyOptional({
    description: 'Longitud del período (FHIR repeat.period), mayor que 0',
    minimum: 0,
    exclusiveMinimum: true,
    maximum: TIMING_PERIOD_MAX,
  })
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @IsPositive()
  @Max(TIMING_PERIOD_MAX)
  @RequiresTogether(['frequency', 'periodUnit'])
  period?: number;

  /** Unidad del período. */
  @ApiPropertyOptional({
    description: 'Unidad del período: h (horas), d (días), wk (semanas)',
    enum: MEDICATION_PERIOD_UNITS,
  })
  @IsOptional()
  @IsIn(MEDICATION_PERIOD_UNITS)
  @RequiresTogether(['frequency', 'period'])
  periodUnit?: MedicationPeriodUnit;

  /** Horas locales del día. */
  @ApiPropertyOptional({
    description:
      'Horas locales del día en formato HH:mm (FHIR repeat.timeOfDay). Excluye frequency y asNeeded',
    type: [String],
    example: ['08:00', '20:00'],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(TIMES_OF_DAY_MAX)
  @IsString({ each: true })
  @Matches(TIME_OF_DAY_PATTERN, {
    each: true,
    message: 'Cada hora del día debe ser HH:mm, de 00:00 a 23:59',
  })
  @ExcludesFields(['asNeeded', 'frequency'])
  timesOfDay?: string[];

  /** Ancla de la primera toma. */
  @ApiPropertyOptional({
    description:
      'Primera toma. Si falta se usa el inicio de vigencia y, si tampoco, la emisión',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  startAt?: string;

  /** Duración del tratamiento en días. */
  @ApiPropertyOptional({
    description: 'Duración en días desde la primera toma; 0 = sin tomas',
    minimum: 0,
    maximum: TIMING_DURATION_DAYS_MAX,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(TIMING_DURATION_DAYS_MAX)
  durationDays?: number;

  /** Zona horaria de las horas del día. */
  @ApiPropertyOptional({
    description: `Zona IANA de las horas del día (por defecto ${DEFAULT_MEDICATION_TIME_ZONE})`,
    example: DEFAULT_MEDICATION_TIME_ZONE,
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  @IsIanaTimeZone()
  timeZone?: string;
}

/** Posología estructurada tal como se lee de vuelta (null = no declarada). */
export class MedicationTimingResponseDto {
  /** PRN / «según necesidad». */
  @ApiProperty()
  asNeeded!: boolean;

  /** Tomas por período. */
  @ApiPropertyOptional({ nullable: true })
  frequency?: number | null;

  /** Longitud del período. */
  @ApiPropertyOptional({ nullable: true })
  period?: number | null;

  /** Unidad del período. */
  @ApiPropertyOptional({ enum: MEDICATION_PERIOD_UNITS, nullable: true })
  periodUnit?: MedicationPeriodUnit | null;

  /** Horas locales del día. */
  @ApiPropertyOptional({ type: [String], nullable: true })
  timesOfDay?: string[] | null;

  /** Ancla de la primera toma. */
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  startAt?: Date | null;

  /** Duración en días. */
  @ApiPropertyOptional({ nullable: true })
  durationDays?: number | null;

  /** Zona IANA efectiva. */
  @ApiProperty()
  timeZone!: string;
}
