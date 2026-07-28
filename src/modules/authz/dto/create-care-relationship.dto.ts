import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsIn, IsOptional, IsUUID } from 'class-validator';

/** Tipo de relación asistencial (C-06 / CAN-AUTH-001). */
export const CARE_RELATIONSHIP_TYPES = [
  'TREATING',
  'CONSULTING',
  'EMERGENCY',
] as const;
export type CareRelationshipType = (typeof CARE_RELATIONSHIP_TYPES)[number];

/** Propósito de uso opcional que acota la relación asistencial. */
export const CARE_RELATIONSHIP_PURPOSES = [
  'TREATMENT',
  'PAYMENT',
  'OPERATIONS',
  'EMERGENCY',
] as const;
export type CareRelationshipPurpose =
  (typeof CARE_RELATIONSHIP_PURPOSES)[number];

/** Cuerpo de `POST /authz/care-relationships`. */
export class CreateCareRelationshipDto {
  @ApiProperty({ description: 'Tenant de la relación', format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ description: 'Perfil del paciente', format: 'uuid' })
  @IsUUID()
  patientProfileId!: string;

  @ApiProperty({ description: 'Perfil del practicante', format: 'uuid' })
  @IsUUID()
  practitionerProfileId!: string;

  @ApiProperty({
    description: 'Tipo de relación',
    enum: CARE_RELATIONSHIP_TYPES,
  })
  @IsIn(CARE_RELATIONSHIP_TYPES)
  relationshipType!: CareRelationshipType;

  @ApiPropertyOptional({
    description: 'Propósito de uso que acota la relación',
    enum: CARE_RELATIONSHIP_PURPOSES,
  })
  @IsOptional()
  @IsIn(CARE_RELATIONSHIP_PURPOSES)
  purposeOfUse?: CareRelationshipPurpose;

  @ApiPropertyOptional({
    description: 'Inicio de vigencia (por defecto ahora)',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  validFrom?: Date;

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
