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
   * P43: instancia del formulario médico (cerrada) de la que sale el registro.
   */
  @ApiPropertyOptional({
    description:
      'Instancia CERRADA del formulario médico (forms.form_instances) de la que ' +
      'sale la orden. Opcional: desde la historia se emite sin formulario. Si viaja, ' +
      'debe existir, estar cerrada y ser del mismo encuentro (422 PRECONDITION_FAILED si no)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  formInstanceId?: string;

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
   * Modo de ejecutor recomendado. Omitido ⇒ que elija el paciente.
   */
  @ApiPropertyOptional({
    description:
      'Quién ejecuta la orden (concept id del conjunto `service-request-performer-selection`: SR_PERF_SELF, SR_PERF_ORGANIZATION, SR_PERF_PATIENT_CHOICE). Es una recomendación, no un candado; omitido = que elija el paciente',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  performerSelectionConceptId?: string;

  /**
   * Médico ejecutor: obligatorio con «lo hago yo» e igual a quien pide; prohibido en los otros modos.
   */
  @ApiPropertyOptional({
    description:
      'Médico ejecutor. Obligatorio con SR_PERF_SELF (debe ser quien pide la orden); prohibido con los otros modos',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  performerPractitionerProfileId?: string;

  /**
   * Sede sugerida: obligatoria con «lo hago yo» y «en este centro»; prohibida si elige el paciente.
   */
  @ApiPropertyOptional({
    description:
      'Sede sugerida (practice.practice_sites). Obligatoria con SR_PERF_SELF y SR_PERF_ORGANIZATION; prohibida con SR_PERF_PATIENT_CHOICE. Debe ofrecer el procedimiento con precio. No concede acceso a la orden',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  suggestedPracticeSiteId?: string;

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
   * P43: instancia de formulario de origen (nula si no salió de un formulario).
   */
  @ApiPropertyOptional({
    description:
      'Instancia del formulario médico de la que salió la orden (nulo = sin formulario)',
    format: 'uuid',
    nullable: true,
  })
  formInstanceId?: string | null;

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
   * Modo de ejecutor recomendado (concept id).
   */
  @ApiProperty({
    description: 'Modo de ejecutor recomendado (concept id)',
    format: 'uuid',
  })
  performerSelectionConceptId!: string;

  /**
   * Médico ejecutor, o `null`.
   */
  @ApiProperty({ format: 'uuid', nullable: true, type: String })
  performerPractitionerProfileId!: string | null;

  /**
   * Sede sugerida, o `null`.
   */
  @ApiProperty({ format: 'uuid', nullable: true, type: String })
  suggestedPracticeSiteId!: string | null;

  /**
   * Nombre de la sede sugerida: el paciente ve un nombre y nunca un uuid.
   */
  @ApiProperty({ nullable: true, type: String })
  suggestedPracticeSiteName!: string | null;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
