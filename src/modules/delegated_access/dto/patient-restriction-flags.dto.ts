import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

/** Banderas que restringen a un paciente ante el personal de apoyo. */
export const PATIENT_RESTRICTION_FLAGS = [
  'VIP',
  'CONFIDENTIAL',
  'STAFF_RELATIVE',
  'PROTECTED',
] as const;
export type PatientRestrictionFlagCode =
  (typeof PATIENT_RESTRICTION_FLAGS)[number];

export class RestrictionFlagInputDto {
  @ApiProperty({ enum: PATIENT_RESTRICTION_FLAGS })
  @IsIn(PATIENT_RESTRICTION_FLAGS)
  flag!: PatientRestrictionFlagCode;

  @ApiProperty({
    minLength: 10,
    description: 'Por qué se restringe (al menos 10 caracteres).',
  })
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  reason!: string;

  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Fin de la restricción; vacío = sin fin.',
  })
  @IsOptional()
  @IsDateString()
  validTo?: string;
}

/** Reemplaza el conjunto de banderas del paciente (lo que no venga se quita). */
export class PutRestrictionFlagsDto {
  @ApiProperty({ type: [RestrictionFlagInputDto] })
  @IsArray()
  @ArrayMaxSize(PATIENT_RESTRICTION_FLAGS.length)
  @ValidateNested({ each: true })
  @Type(() => RestrictionFlagInputDto)
  flags!: RestrictionFlagInputDto[];

  @ApiPropertyOptional({
    minLength: 10,
    maxLength: 500,
    description:
      'Por qué se retira o afloja una restricción (obligatorio si el conjunto quita una bandera o acorta su fin; ' +
      'al menos 10 caracteres, sin datos clínicos). Además exige el paso extra y ser el doctor titular o SECURITY_ADMIN. ' +
      'El asiento guarda solo su largo y su huella, nunca el texto.',
  })
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  removalReason?: string;
}

export class RestrictionFlagViewDto {
  @ApiProperty({ enum: PATIENT_RESTRICTION_FLAGS })
  flag!: PatientRestrictionFlagCode;
  @ApiProperty() reason!: string;
  @ApiProperty({ type: String, format: 'date-time' }) validFrom!: Date;
  @ApiPropertyOptional({ type: String, format: 'date-time' }) validTo?: Date;
}

export class PatientRestrictionFlagsResponseDto {
  @ApiProperty({ format: 'uuid' }) patientProfileId!: string;
  @ApiProperty({ type: [RestrictionFlagViewDto] })
  flags!: RestrictionFlagViewDto[];
}
