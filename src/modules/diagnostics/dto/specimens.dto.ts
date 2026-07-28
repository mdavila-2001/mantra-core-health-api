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
  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({ format: 'uuid', description: 'Paciente dueño del espécimen' })
  @IsUUID()
  patientProfileId!: string;

  /**
   * Identificador asociado a custodian tenant.
   */
  @ApiProperty({ format: 'uuid', description: 'Tenant custodio' })
  @IsUUID()
  custodianTenantId!: string;

  /**
   * Identificador asociado a specimen type concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Tipo de espécimen (concept id)',
  })
  @IsUUID()
  specimenTypeConceptId!: string;

  /**
   * Identificador asociado a service request.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Orden clínica de origen',
  })
  @IsOptional()
  @IsUUID()
  serviceRequestId?: string;

  /**
   * Identificador asociado a encounter.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  /**
   * Identificador asociado a body site concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Sitio anatómico (concept id)',
  })
  @IsOptional()
  @IsUUID()
  bodySiteConceptId?: string;

  /**
   * Identificador asociado a collection method concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Método de recolección (concept id)',
  })
  @IsOptional()
  @IsUUID()
  collectionMethodConceptId?: string;

  /**
   * Identificador asociado a collector profile.
   */
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
  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({ format: 'uuid', description: 'Paciente dueño de la acesión' })
  @IsUUID()
  patientProfileId!: string;

  /**
   * Identificador asociado a custodian tenant.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Tenant custodio (por defecto el del token)',
  })
  @IsOptional()
  @IsUUID()
  custodianTenantId?: string;

  /**
   * Valor de specimen ids mantenido por la instancia.
   */
  @ApiProperty({
    type: [String],
    format: 'uuid',
    description: 'Especímenes a acesionar',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  specimenIds!: string[];

  /**
   * Valor de accession number mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Nº de acesión (se genera si se omite)' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  accessionNumber?: string;

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
   * Identificador asociado a service request.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  serviceRequestId?: string;
}

/** Cuerpo de `POST /diagnostics/specimens/{id}/rejection` (UC-20-02). */
export class RejectSpecimenDto {
  /**
   * Identificador asociado a rejection reason concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Motivo de rechazo (concept id)',
  })
  @IsUUID()
  rejectionReasonConceptId!: string;

  /**
   * Valor de notes mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Notas del rechazo' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  /**
   * Valor de recollection required mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: '¿Requiere nueva recolección?' })
  @IsOptional()
  @IsBoolean()
  recollectionRequired?: boolean;

  /**
   * Identificador asociado a recollection service request.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Nueva orden de recolección',
  })
  @IsOptional()
  @IsUUID()
  recollectionServiceRequestId?: string;

  /**
   * Identificador asociado a rejected by profile.
   */
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
  /**
   * Valor de container identifier mantenido por la instancia.
   */
  @ApiProperty({ description: 'Identificador del contenedor' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  containerIdentifier!: string;

  /**
   * Identificador asociado a container type concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Tipo de contenedor (concept id)',
  })
  @IsUUID()
  containerTypeConceptId!: string;

  /**
   * Identificador asociado a additive concept.
   */
  @ApiPropertyOptional({ format: 'uuid', description: 'Aditivo (concept id)' })
  @IsOptional()
  @IsUUID()
  additiveConceptId?: string;

  /**
   * Identificador asociado a parent container.
   */
  @ApiPropertyOptional({ format: 'uuid', description: 'Contenedor padre' })
  @IsOptional()
  @IsUUID()
  parentContainerId?: string;
}

/** Cuerpo de `POST /diagnostics/containers/{id}/custody-events` (UC-20-03). */
export class ContainerCustodyEventDto {
  /**
   * Identificador asociado a specimen.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Espécimen asociado al contenedor',
  })
  @IsUUID()
  specimenId!: string;

  /**
   * Identificador asociado a event type concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Tipo de evento de contenedor (concept id)',
  })
  @IsOptional()
  @IsUUID()
  eventTypeConceptId?: string;

  /**
   * Identificador asociado a to party type concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Tipo de parte destino (concept id)',
  })
  @IsOptional()
  @IsUUID()
  toPartyTypeConceptId?: string;

  /**
   * Identificador asociado a to party.
   */
  @ApiPropertyOptional({ format: 'uuid', description: 'Id de parte destino' })
  @IsOptional()
  @IsUUID()
  toPartyId?: string;

  /**
   * Valor de temperature celsius mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Temperatura en °C' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  temperatureCelsius?: string;

  /**
   * Valor de seal identifier mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Sello de custodia' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  sealIdentifier?: string;

  /**
   * Valor de evidence hash mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Hash de evidencia' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  evidenceHash?: string;

  /**
   * Identificador asociado a destination status concept.
   */
  @ApiPropertyOptional({
    description: 'Estado destino del contenedor (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  destinationStatusConceptId?: string;

  /**
   * Valor de notes mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Notas del traslado' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
