import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  Matches,
  Max,
  Min,
  Validate,
  ValidateNested,
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from 'class-validator';

/** Two shifts per day at most (midday closing), seven days a week. */
export const MAX_SHIFTS_PER_DAY = 2;
export const MAX_OPENING_HOURS_SHIFTS = 7 * MAX_SHIFTS_PER_DAY;

const OPENS_AT = /^([01]\d|2[0-3]):[0-5]\d$/;
// `24:00` closes a full day: «abierto las 24 h» is 00:00–24:00.
const CLOSES_AT = /^(([01]\d|2[0-3]):[0-5]\d|24:00)$/;

/** One opening-hours shift of a site, as declared at sign-up. */
export class OpeningHoursShiftDto {
  @ApiProperty({
    minimum: 1,
    maximum: 7,
    example: 1,
    description: 'Día ISO-8601: 1 = lunes … 7 = domingo',
  })
  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek!: number;

  @ApiProperty({
    example: '08:00',
    description: 'Apertura, HH:MM (00:00–23:59)',
  })
  @Matches(OPENS_AT, { message: 'opensAt debe ser HH:MM' })
  opensAt!: string;

  @ApiProperty({
    example: '12:30',
    description: 'Cierre, HH:MM; 24:00 cierra el día. Posterior a la apertura',
  })
  @Matches(CLOSES_AT, { message: 'closesAt debe ser HH:MM o 24:00' })
  closesAt!: string;
}

/** Why a list of shifts is inconsistent, or `null` when it is fine. */
export function openingHoursProblem(
  shifts: readonly OpeningHoursShiftDto[],
): string | null {
  const byDay = new Map<number, OpeningHoursShiftDto[]>();
  for (const shift of shifts) {
    if (shift.closesAt <= shift.opensAt) {
      return 'Cada turno cierra después de abrir';
    }
    byDay.set(shift.dayOfWeek, [...(byDay.get(shift.dayOfWeek) ?? []), shift]);
  }
  for (const day of byDay.values()) {
    if (day.length > MAX_SHIFTS_PER_DAY) {
      return `Un día tiene como mucho ${MAX_SHIFTS_PER_DAY} turnos`;
    }
    const [first, second] = [...day].sort((a, b) =>
      a.opensAt.localeCompare(b.opensAt),
    );
    if (second && second.opensAt < first.closesAt) {
      return 'Los turnos de un mismo día no se superponen';
    }
  }
  return null;
}

@ValidatorConstraint({ name: 'openingHoursConsistent' })
class OpeningHoursConsistent implements ValidatorConstraintInterface {
  validate(shifts: unknown): boolean {
    // Shape errors are reported by the nested validators.
    if (!Array.isArray(shifts)) return true;
    return openingHoursProblem(shifts as OpeningHoursShiftDto[]) === null;
  }

  defaultMessage(): string {
    return 'El horario de atención tiene turnos inválidos, superpuestos o más de dos por día';
  }
}

/**
 * The weekly opening hours of a site: optional, up to two non-overlapping
 * shifts per day. Every field that carries hours uses this one decorator.
 */
export function OpeningHoursField(): PropertyDecorator {
  return applyDecorators(
    ApiPropertyOptional({
      type: [OpeningHoursShiftDto],
      maxItems: MAX_OPENING_HOURS_SHIFTS,
      description:
        'Horario de atención semanal: hasta dos turnos por día, sin superponerse',
    }),
    IsOptional(),
    IsArray(),
    ArrayMaxSize(MAX_OPENING_HOURS_SHIFTS),
    ValidateNested({ each: true }),
    Type(() => OpeningHoursShiftDto),
    Validate(OpeningHoursConsistent),
  );
}
