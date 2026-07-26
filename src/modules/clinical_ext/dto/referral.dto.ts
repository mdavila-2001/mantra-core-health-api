import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsISO8601, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/** Cuerpo de `POST /referrals` (UC-18-07). */
export class CreateReferralDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  patientProfileId!: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Encuentro origen' })
  @IsOptional()
  @IsUUID()
  sourceEncounterId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Profesional que deriva' })
  @IsOptional()
  @IsUUID()
  referringProfileId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Profesional destino' })
  @IsOptional()
  @IsUUID()
  targetProfileId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Tenant destino (referencia inter-tenant)' })
  @IsOptional()
  @IsUUID()
  targetTenantId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Especialidad destino (concept id)' })
  @IsOptional()
  @IsUUID()
  specialtyConceptId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Motivo codificado (concept id)' })
  @IsOptional()
  @IsUUID()
  reasonConceptId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reasonText?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Prioridad (concept id)' })
  @IsOptional()
  @IsUUID()
  priorityConceptId?: string;

  @ApiPropertyOptional({ type: String, format: 'date', description: 'Vigencia de la referencia' })
  @IsOptional()
  @IsISO8601()
  validUntil?: string;
}

/** Cuerpo de `PATCH /referrals/{id}/respond` (UC-18-08). */
export class RespondReferralDto {
  @ApiProperty({ enum: ['ACCEPT', 'REJECT'], description: 'Decisión del tenant destino' })
  @IsIn(['ACCEPT', 'REJECT'])
  decision!: 'ACCEPT' | 'REJECT';
}

/** Respuesta de una referencia. */
export class ReferralResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  @ApiProperty({ format: 'uuid', description: 'Estado de la referencia (concept id)' })
  statusConceptId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
