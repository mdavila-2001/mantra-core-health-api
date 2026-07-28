import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsIn, IsOptional, IsUUID } from 'class-validator';

/** Propósito de uso (purpose-of-use) de un acceso clínico. */
export const PURPOSES_OF_USE = ['TREATMENT', 'PAYMENT', 'OPERATIONS'] as const;
/**
 * Define el tipo de dominio purpose of use.
 */
export type PurposeOfUse = (typeof PURPOSES_OF_USE)[number];

/** Nivel de acceso concedido. */
export const ACCESS_LEVELS = ['READ', 'WRITE', 'FULL'] as const;
/**
 * Define el tipo de dominio access level.
 */
export type AccessLevel = (typeof ACCESS_LEVELS)[number];

/** Cuerpo de `POST /authz/patients/{patientProfileId}/clinical-access-grants` (UC-06-06). */
export class CreateClinicalAccessGrantDto {
  /**
   * Identificador asociado a granted user.
   */
  @ApiProperty({ description: 'Usuario que recibe el acceso', format: 'uuid' })
  @IsUUID()
  grantedUserId!: string;

  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ description: 'Tenant del acceso', format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Valor de purpose of use mantenido por la instancia.
   */
  @ApiProperty({ description: 'Propósito de uso', enum: PURPOSES_OF_USE })
  @IsIn(PURPOSES_OF_USE)
  purposeOfUse!: PurposeOfUse;

  /**
   * Valor de access level mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nivel de acceso', enum: ACCESS_LEVELS })
  @IsIn(ACCESS_LEVELS)
  accessLevel!: AccessLevel;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Fin de vigencia',
    type: String,
    format: 'date-time',
  })
  @Type(() => Date)
  @IsDate()
  validTo!: Date;

  /**
   * Identificador asociado a branch.
   */
  @ApiPropertyOptional({ description: 'Sede/branch', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  /**
   * Identificador asociado a encounter.
   */
  @ApiPropertyOptional({
    description: 'Encuentro clínico asociado',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  /**
   * Identificador asociado a consent.
   */
  @ApiPropertyOptional({
    description:
      'Consentimiento que respalda el acceso (obligatorio salvo tratamiento directo)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  consentId?: string;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Inicio de vigencia (por defecto ahora)',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  validFrom?: Date;
}
