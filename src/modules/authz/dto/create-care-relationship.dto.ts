import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsIn, IsOptional, IsUUID } from 'class-validator';

/** Tipo de relación asistencial (C-06 / CAN-AUTH-001). */
export const CARE_RELATIONSHIP_TYPES = [
  'TREATING',
  'CONSULTING',
  'EMERGENCY',
] as const;
/**
 * Define el tipo de dominio care relationship type.
 */
export type CareRelationshipType = (typeof CARE_RELATIONSHIP_TYPES)[number];

/** Propósito de uso opcional que acota la relación asistencial. */
export const CARE_RELATIONSHIP_PURPOSES = [
  'TREATMENT',
  'PAYMENT',
  'OPERATIONS',
  'EMERGENCY',
] as const;
/**
 * Define el tipo de dominio care relationship purpose.
 */
export type CareRelationshipPurpose =
  (typeof CARE_RELATIONSHIP_PURPOSES)[number];

/** Cuerpo de `POST /authz/care-relationships`. */
export class CreateCareRelationshipDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ description: 'Tenant de la relación', format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({ description: 'Perfil del paciente', format: 'uuid' })
  @IsUUID()
  patientProfileId!: string;

  /**
   * Identificador asociado a practitioner profile.
   */
  @ApiProperty({ description: 'Perfil del practicante', format: 'uuid' })
  @IsUUID()
  practitionerProfileId!: string;

  /**
   * Valor de relationship type mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Tipo de relación',
    enum: CARE_RELATIONSHIP_TYPES,
  })
  @IsIn(CARE_RELATIONSHIP_TYPES)
  relationshipType!: CareRelationshipType;

  /**
   * Valor de purpose of use mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Propósito de uso que acota la relación',
    enum: CARE_RELATIONSHIP_PURPOSES,
  })
  @IsOptional()
  @IsIn(CARE_RELATIONSHIP_PURPOSES)
  purposeOfUse?: CareRelationshipPurpose;

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

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Fin de vigencia (abierto si se omite)',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  validTo?: Date;
}
