import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsIn, IsOptional, IsUUID } from 'class-validator';

/** Propósito de uso (purpose-of-use) de un acceso clínico. */
export const PURPOSES_OF_USE = ['TREATMENT', 'PAYMENT', 'OPERATIONS'] as const;
export type PurposeOfUse = (typeof PURPOSES_OF_USE)[number];

/** Nivel de acceso concedido. */
export const ACCESS_LEVELS = ['READ', 'WRITE', 'FULL'] as const;
export type AccessLevel = (typeof ACCESS_LEVELS)[number];

/** Cuerpo de `POST /authz/patients/{patientProfileId}/clinical-access-grants` (UC-06-06). */
export class CreateClinicalAccessGrantDto {
  @ApiProperty({ description: 'Usuario que recibe el acceso', format: 'uuid' })
  @IsUUID()
  grantedUserId!: string;

  @ApiProperty({ description: 'Tenant del acceso', format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ description: 'Propósito de uso', enum: PURPOSES_OF_USE })
  @IsIn(PURPOSES_OF_USE)
  purposeOfUse!: PurposeOfUse;

  @ApiProperty({ description: 'Nivel de acceso', enum: ACCESS_LEVELS })
  @IsIn(ACCESS_LEVELS)
  accessLevel!: AccessLevel;

  @ApiProperty({ description: 'Fin de vigencia', type: String, format: 'date-time' })
  @Type(() => Date)
  @IsDate()
  validTo!: Date;

  @ApiPropertyOptional({ description: 'Sede/branch', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Encuentro clínico asociado', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  @ApiPropertyOptional({
    description: 'Consentimiento que respalda el acceso (obligatorio salvo tratamiento directo)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  consentId?: string;

  @ApiPropertyOptional({ description: 'Inicio de vigencia (por defecto ahora)', type: String, format: 'date-time' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  validFrom?: Date;
}
