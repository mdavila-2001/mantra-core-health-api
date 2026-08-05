import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import {
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

/** Cuerpo de `POST /referrals` (UC-18-07). */
@ApiSchema({ name: 'ClinicalExtCreateReferralDto' })
export class CreateReferralDto {
  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  patientProfileId!: string;

  /**
   * Identificador asociado a source encounter.
   */
  @ApiPropertyOptional({ format: 'uuid', description: 'Encuentro origen' })
  @IsOptional()
  @IsUUID()
  sourceEncounterId?: string;

  /**
   * Identificador asociado a referring profile.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Profesional que deriva',
  })
  @IsOptional()
  @IsUUID()
  referringProfileId?: string;

  /**
   * Identificador asociado a target profile.
   */
  @ApiPropertyOptional({ format: 'uuid', description: 'Profesional destino' })
  @IsOptional()
  @IsUUID()
  targetProfileId?: string;

  /**
   * Identificador asociado a target tenant.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Tenant destino (referencia inter-tenant)',
  })
  @IsOptional()
  @IsUUID()
  targetTenantId?: string;

  /**
   * Identificador asociado a specialty concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Especialidad destino (concept id)',
  })
  @IsOptional()
  @IsUUID()
  specialtyConceptId?: string;

  /**
   * Identificador asociado a reason concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Motivo codificado (concept id)',
  })
  @IsOptional()
  @IsUUID()
  reasonConceptId?: string;

  /**
   * Valor de reason text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reasonText?: string;

  /**
   * Identificador asociado a priority concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Prioridad (concept id)',
  })
  @IsOptional()
  @IsUUID()
  priorityConceptId?: string;

  /**
   * Valor de valid until mantenido por la instancia.
   */
  @ApiPropertyOptional({
    type: String,
    format: 'date',
    description: 'Vigencia de la referencia',
  })
  @IsOptional()
  @IsISO8601()
  validUntil?: string;
}

/** Cuerpo de `PATCH /referrals/{id}/respond` (UC-18-08). */
export class RespondReferralDto {
  /**
   * Valor de decision mantenido por la instancia.
   */
  @ApiProperty({
    enum: ['ACCEPT', 'REJECT'],
    description: 'Decisión del tenant destino',
  })
  @IsIn(['ACCEPT', 'REJECT'])
  decision!: 'ACCEPT' | 'REJECT';
}

/** Respuesta de una referencia. */
export class ReferralResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Estado de la referencia (concept id)',
  })
  statusConceptId!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
