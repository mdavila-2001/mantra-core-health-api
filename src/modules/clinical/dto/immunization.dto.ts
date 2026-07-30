import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

/** Cuerpo de `POST /clinical/immunizations` (UC-08-13). */
export class CreateImmunizationDto {
  /**
   * Identificador asociado a custodian tenant.
   */
  @ApiProperty({
    description: 'Tenant custodio (directory.tenants)',
    format: 'uuid',
  })
  @IsUUID()
  custodianTenantId!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({
    description: 'Paciente (profiles.patient_profiles)',
    format: 'uuid',
  })
  @IsUUID()
  patientProfileId!: string;

  /**
   * Identificador asociado a vaccine concept.
   */
  @ApiProperty({ description: 'Vacuna (concept id)', format: 'uuid' })
  @IsUUID()
  vaccineConceptId!: string;

  /**
   * Valor de dose number mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Número de dosis' })
  @IsOptional()
  @IsInt()
  @Min(1)
  doseNumber?: number;

  /**
   * Valor de lot number mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Número de lote' })
  @IsOptional()
  @IsString()
  lotNumber?: string;

  /**
   * Identificador asociado a route concept.
   */
  @ApiPropertyOptional({
    description: 'Vía de administración (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  routeConceptId?: string;

  /**
   * Valor de administered at mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Momento de administración',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  administeredAt?: string;

  /**
   * Identificador asociado a administered by profile.
   */
  @ApiPropertyOptional({
    description: 'Profesional que administra',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  administeredByProfileId?: string;
}

/** Respuesta tras registrar una inmunización. */
export class ImmunizationResponseDto {
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
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ description: 'Estado (concept id)', format: 'uuid' })
  status!: string;

  /**
   * Valor de dose number mantenido por la instancia.
   */
  @ApiPropertyOptional({ nullable: true })
  doseNumber!: number | null;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
