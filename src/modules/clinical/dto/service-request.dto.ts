import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

/** Cuerpo de `POST /clinical/service-requests` (UC-08-05). */
export class CreateServiceRequestDto {
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
   * Identificador asociado a encounter.
   */
  @ApiPropertyOptional({ description: 'Encuentro en curso', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  /**
   * Identificador asociado a code concept.
   */
  @ApiProperty({
    description: 'Código del servicio pedido (concept id)',
    format: 'uuid',
  })
  @IsUUID()
  codeConceptId!: string;

  /**
   * Identificador asociado a category concept.
   */
  @ApiPropertyOptional({
    description: 'Categoría (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  categoryConceptId?: string;

  /**
   * Identificador asociado a priority concept.
   */
  @ApiPropertyOptional({
    description: 'Prioridad (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  priorityConceptId?: string;

  /**
   * Identificador asociado a requester profile.
   */
  @ApiPropertyOptional({
    description: 'Profesional solicitante',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  requesterProfileId?: string;

  /**
   * Identificador asociado a performer tenant.
   */
  @ApiPropertyOptional({ description: 'Tenant ejecutante', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  performerTenantId?: string;

  /**
   * El informe diagnóstico previo que satisface este pedido (antiduplicación,
   * v4.2.17). Obligatorio cuando el chequeo previo (`duplicate-check`) marcó
   * `isDuplicate: true` y el médico decidió: exactamente el que devolvió el
   * chequeo, o el alta responde 422. Junto con `reusePreviousReport` o
   * `duplicateOverrideReason`, nunca los dos a la vez.
   */
  @ApiPropertyOptional({
    description:
      'Informe previo que satisface el pedido (antiduplicación). Va con reusePreviousReport o duplicateOverrideReason.',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  previousDiagnosticReportId?: string;

  /**
   * El médico eligió reutilizar el informe previo en vez de repetir el
   * estudio: la orden nace satisfecha por él y no es facturable. Exige
   * `previousDiagnosticReportId`.
   */
  @ApiPropertyOptional({
    description:
      'Reutilizar el informe previo detectado en vez de repetir el estudio',
  })
  @ValidateIf(
    (o: CreateServiceRequestDto) => o.reusePreviousReport !== undefined,
  )
  @IsBoolean()
  reusePreviousReport?: boolean;

  /**
   * Justificación clínica del médico para repetir un estudio duplicado. Exige
   * `previousDiagnosticReportId` y es incompatible con `reusePreviousReport`.
   */
  @ApiPropertyOptional({
    description:
      'Justificación clínica formal para repetir un estudio duplicado (mínimo 20 caracteres)',
    minLength: 20,
    maxLength: 1000,
  })
  @ValidateIf(
    (o: CreateServiceRequestDto) => o.duplicateOverrideReason !== undefined,
  )
  @IsString()
  @MinLength(20, {
    message: 'La justificación clínica requiere al menos 20 caracteres',
  })
  @MaxLength(1000)
  duplicateOverrideReason?: string;
}

/** Respuesta tras crear una orden de servicio. */
export class ServiceRequestResponseDto {
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
   * Valor de intent mantenido por la instancia.
   */
  @ApiProperty({ description: 'Intención (concept id)', format: 'uuid' })
  intent!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
