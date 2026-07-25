import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

/** Cuerpo de `POST /clinical/service-requests` (UC-08-05). */
export class CreateServiceRequestDto {
  @ApiProperty({ description: 'Tenant custodio (directory.tenants)', format: 'uuid' })
  @IsUUID()
  custodianTenantId!: string;

  @ApiProperty({ description: 'Paciente (profiles.patient_profiles)', format: 'uuid' })
  @IsUUID()
  patientProfileId!: string;

  @ApiPropertyOptional({ description: 'Encuentro en curso', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  @ApiProperty({ description: 'Código del servicio pedido (concept id)', format: 'uuid' })
  @IsUUID()
  codeConceptId!: string;

  @ApiPropertyOptional({ description: 'Categoría (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  categoryConceptId?: string;

  @ApiPropertyOptional({ description: 'Prioridad (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  priorityConceptId?: string;

  @ApiPropertyOptional({ description: 'Profesional solicitante', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  requesterProfileId?: string;

  @ApiPropertyOptional({ description: 'Tenant ejecutante', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  performerTenantId?: string;
}

/** Respuesta tras crear una orden de servicio. */
export class ServiceRequestResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  @ApiProperty({ description: 'Estado (concept id)', format: 'uuid' })
  status!: string;

  @ApiProperty({ description: 'Intención (concept id)', format: 'uuid' })
  intent!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
