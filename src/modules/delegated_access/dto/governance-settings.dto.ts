import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

/**
 * Ajustes de gobierno de una organización (`practice_settings['support.governance']`,
 * CONTRATO-GOBIERNO §7.2). Todos opcionales al escribir: lo que no se envía queda
 * con su valor actual (o el de siempre). Los rangos los valida el servicio y
 * responden 422 `GOVERNANCE_SETTINGS_INVALID` con la lista de campos.
 */
export class PutGovernanceSettingsDto {
  @ApiPropertyOptional({
    description:
      'La compuerta de ingreso bloquea el acceso hasta completar la lista.',
  })
  @IsOptional()
  @IsBoolean()
  onboardingRequired?: boolean;

  @ApiPropertyOptional({
    format: 'date-time',
    nullable: true,
    description:
      'La compuerta rige solo para vínculos creados desde esta fecha.',
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsDateString()
  onboardingRequiredSince?: string | null;

  @ApiPropertyOptional({ minimum: 7, maximum: 365 })
  @IsOptional()
  @IsInt()
  @Min(7)
  @Max(365)
  inactivityDays?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 365 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  unusedDays?: number;

  @ApiPropertyOptional({
    nullable: true,
    minimum: 14,
    maximum: 730,
    description:
      'Suspende sola a quien no actúa en estos días; vacío = solo sugerir.',
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsInt()
  @Min(14)
  @Max(730)
  autoSuspendInactiveDays?: number | null;

  @ApiPropertyOptional({ enum: [6, 12] })
  @IsOptional()
  @IsIn([6, 12])
  reviewCadenceMonths?: 6 | 12;

  @ApiPropertyOptional({ minimum: 1, maximum: 180 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(180)
  maxSodExceptionDays?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 200 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  creepThreshold?: number;

  @ApiPropertyOptional({ minimum: 5, maximum: 1440 })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(1440)
  fourEyesActionTtlMinutes?: number;

  @ApiPropertyOptional({ minimum: 7, maximum: 365 })
  @IsOptional()
  @IsInt()
  @Min(7)
  @Max(365)
  suspensionReviewAfterDays?: number;
}

/** Ajustes completos (con los valores de siempre donde la organización no fijó nada). */
export class GovernanceSettingsDto {
  @ApiProperty() onboardingRequired!: boolean;
  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  onboardingRequiredSince!: string | null;
  @ApiProperty() inactivityDays!: number;
  @ApiProperty() unusedDays!: number;
  @ApiProperty({ nullable: true }) autoSuspendInactiveDays!: number | null;
  @ApiProperty({ enum: [6, 12] }) reviewCadenceMonths!: 6 | 12;
  @ApiProperty() maxSodExceptionDays!: number;
  @ApiProperty() creepThreshold!: number;
  @ApiProperty() fourEyesActionTtlMinutes!: number;
  @ApiProperty() suspensionReviewAfterDays!: number;
}

/** Respuesta de lectura y escritura de ajustes. */
export class GovernanceSettingsResponseDto {
  @ApiProperty({ type: GovernanceSettingsDto })
  settings!: GovernanceSettingsDto;
  @ApiProperty({
    description: 'Verdadero si la organización aún no guardó ajustes propios.',
  })
  isDefault!: boolean;
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  updatedAt?: Date;
}
