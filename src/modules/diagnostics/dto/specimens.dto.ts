import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

/** Cuerpo de `POST /diagnostics/specimens` (soporte: alta de espécimen). */
export class CreateSpecimenDto {
  @ApiProperty({ format: 'uuid', description: 'Paciente dueño del espécimen' })
  @IsUUID()
  patientProfileId!: string;

  @ApiProperty({ format: 'uuid', description: 'Tenant custodio' })
  @IsUUID()
  custodianTenantId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Tipo de espécimen (concept id)',
  })
  @IsUUID()
  specimenTypeConceptId!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Orden clínica de origen',
  })
  @IsOptional()
  @IsUUID()
  serviceRequestId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Sitio anatómico (concept id)',
  })
  @IsOptional()
  @IsUUID()
  bodySiteConceptId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Método de recolección (concept id)',
  })
  @IsOptional()
  @IsUUID()
  collectionMethodConceptId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Profesional que recolecta',
  })
  @IsOptional()
  @IsUUID()
  collectorProfileId?: string;
}

/** Cuerpo de `POST /diagnostics/accessions` (UC-20-01). */
export class CreateAccessionDto {
  @ApiProperty({ format: 'uuid', description: 'Paciente dueño de la acesión' })
  @IsUUID()
  patientProfileId!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Tenant custodio (por defecto el del token)',
  })
  @IsOptional()
  @IsUUID()
  custodianTenantId?: string;

  @ApiProperty({
    type: [String],
    format: 'uuid',
    description: 'Especímenes a acesionar',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  specimenIds!: string[];

  @ApiPropertyOptional({ description: 'Nº de acesión (se genera si se omite)' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  accessionNumber?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Prioridad (concept id)',
  })
  @IsOptional()
  @IsUUID()
  priorityConceptId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  serviceRequestId?: string;
}

/** Cuerpo de `POST /diagnostics/specimens/{id}/rejection` (UC-20-02). */
export class RejectSpecimenDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Motivo de rechazo (concept id)',
  })
  @IsUUID()
  rejectionReasonConceptId!: string;

  @ApiPropertyOptional({ description: 'Notas del rechazo' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({ description: '¿Requiere nueva recolección?' })
  @IsOptional()
  @IsBoolean()
  recollectionRequired?: boolean;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Nueva orden de recolección',
  })
  @IsOptional()
  @IsUUID()
  recollectionServiceRequestId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Profesional que rechaza',
  })
  @IsOptional()
  @IsUUID()
  rejectedByProfileId?: string;
}

/** Cuerpo de `POST /diagnostics/specimens/{id}/containers` (soporte: alta de contenedor). */
export class CreateContainerDto {
  @ApiProperty({ description: 'Identificador del contenedor' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  containerIdentifier!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Tipo de contenedor (concept id)',
  })
  @IsUUID()
  containerTypeConceptId!: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Aditivo (concept id)' })
  @IsOptional()
  @IsUUID()
  additiveConceptId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Contenedor padre' })
  @IsOptional()
  @IsUUID()
  parentContainerId?: string;
}

/** Cuerpo de `POST /diagnostics/containers/{id}/custody-events` (UC-20-03). */
export class ContainerCustodyEventDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Espécimen asociado al contenedor',
  })
  @IsUUID()
  specimenId!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Tipo de evento de contenedor (concept id)',
  })
  @IsOptional()
  @IsUUID()
  eventTypeConceptId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Tipo de parte destino (concept id)',
  })
  @IsOptional()
  @IsUUID()
  toPartyTypeConceptId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Id de parte destino' })
  @IsOptional()
  @IsUUID()
  toPartyId?: string;

  @ApiPropertyOptional({ description: 'Temperatura en °C' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  temperatureCelsius?: string;

  @ApiPropertyOptional({ description: 'Sello de custodia' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  sealIdentifier?: string;

  @ApiPropertyOptional({ description: 'Hash de evidencia' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  evidenceHash?: string;

  @ApiPropertyOptional({
    description: 'Estado destino del contenedor (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  destinationStatusConceptId?: string;

  @ApiPropertyOptional({ description: 'Notas del traslado' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
