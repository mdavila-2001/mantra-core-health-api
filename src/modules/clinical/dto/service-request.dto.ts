import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import {
  ANALYSIS_CATEGORIES,
  type AnalysisCategory,
} from '../service-request-category';
import {
  ImagingDetailDto,
  ServiceRequestComponentDto,
  ServiceRequestImagingDto,
} from './service-request-detail.dto';

/** Tope de notas citadas por orden: más es un listado, no un motivo. */
export const MAX_BASED_ON_NOTES = 20;

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
   * P40 (carril C2): la categoría de análisis en texto. Se guarda como su
   * concepto; si viaja junto con `categoryConceptId`, los dos tienen que
   * decir lo mismo.
   */
  @ApiPropertyOptional({
    description:
      'Categoría de análisis (C2). Se resuelve a categoryConceptId (LAB → SR_LAB, ' +
      'IMAGING → SR_IMAGING, OTHER → SR_OTHER). Si viaja con categoryConceptId y no ' +
      'coinciden: 422 SERVICE_REQUEST_CATEGORY_MISMATCH',
    enum: ANALYSIS_CATEGORIES,
  })
  @IsOptional()
  @IsIn(ANALYSIS_CATEGORIES)
  category?: AnalysisCategory;

  /**
   * P40 (carril C2): las notas médicas que motivan la orden, en el orden en
   * que se citan.
   */
  @ApiPropertyOptional({
    description:
      'Notas médicas (chart.clinical_note_headers) que motivan la orden. Cada una ' +
      'debe ser del mismo paciente, de un encuentro del tenant custodio, firmada o ' +
      'enmendada y sin confidencialidad restringida (si no, 422 BASED_ON_NOTE_NOT_FOUND, ' +
      'sin distinguir el motivo); y, si la orden tiene encuentro, del mismo encuentro ' +
      '(422 BASED_ON_NOTE_ENCOUNTER_MISMATCH)',
    type: [String],
    format: 'uuid',
    maxItems: MAX_BASED_ON_NOTES,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_BASED_ON_NOTES)
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  basedOnNoteIds?: string[];

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
   * v4.2.80: muestra pedida (laboratorio / anatomía patológica).
   */
  @ApiPropertyOptional({
    description:
      'Muestra pedida (value set `specimen-type`). Sólo con laboratorio o anatomía patológica ' +
      '(422 SPECIMEN_NOT_ALLOWED_FOR_CATEGORY / SPECIMEN_TYPE_NOT_IN_CATALOG, con details.reason)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  specimenTypeConceptId?: string;

  /**
   * v4.2.80: componentes marcados del panel.
   */
  @ApiPropertyOptional({
    description:
      'Componentes MARCADOS del panel (conceptos `part-of` del estudio). Un panel desplegable exige ' +
      'la lista y no vacía (422 COMPONENTS_EMPTY); un estudio que no es panel la prohíbe ' +
      '(COMPONENTS_NOT_SELECTABLE); uno ajeno al panel: COMPONENT_NOT_IN_PANEL',
    type: [String],
    format: 'uuid',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(500)
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  componentConceptIds?: string[];

  /**
   * v4.2.80: modalidad, región, lateralidad y contraste de un estudio de imagen.
   */
  @ApiPropertyOptional({ type: () => ImagingDetailDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ImagingDetailDto)
  imaging?: ImagingDetailDto;

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
   * P40: categoría de análisis derivada del concepto; ausente = sin clasificar.
   */
  @ApiPropertyOptional({
    description:
      'Categoría de análisis derivada de categoryConceptId. Ausente = la orden no declara categoría',
    enum: ANALYSIS_CATEGORIES,
  })
  category?: AnalysisCategory;

  /**
   * P40: notas médicas que motivan la orden, en el orden en que se citaron.
   */
  @ApiProperty({
    description: 'Notas médicas que motivan la orden (vacío = ninguna)',
    type: [String],
    format: 'uuid',
  })
  basedOnNoteIds!: string[];

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
   * v4.2.80: requisición que agrupa los renglones pedidos juntos (nulo = alta individual).
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true, type: String })
  requisitionId?: string | null;

  /** v4.2.80: el estudio pedido. */
  @ApiPropertyOptional({ format: 'uuid' })
  codeConceptId?: string;

  /** v4.2.80: nombre legible del estudio. */
  @ApiPropertyOptional()
  codeDisplay?: string;

  /** v4.2.80: muestra pedida (nulo = no se indicó). */
  @ApiPropertyOptional({ format: 'uuid', nullable: true, type: String })
  specimenTypeConceptId?: string | null;

  /** v4.2.80: nombre legible de la muestra. */
  @ApiPropertyOptional({ nullable: true, type: String })
  specimenTypeDisplay?: string | null;

  /**
   * v4.2.80: componentes marcados. Con `componentsSpecified: false` el arreglo
   * va vacío y significa «estudio completo, sin detalle» (órdenes anteriores).
   */
  @ApiPropertyOptional({ type: [ServiceRequestComponentDto] })
  components?: ServiceRequestComponentDto[];

  /** v4.2.80: `false` = orden sin detalle de componentes (anterior o estudio sin desglose). */
  @ApiPropertyOptional()
  componentsSpecified?: boolean;

  /** v4.2.80: detalle de imagen; `null` si la orden no lo trae. */
  @ApiPropertyOptional({ type: () => ServiceRequestImagingDto, nullable: true })
  imaging?: ServiceRequestImagingDto | null;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
