import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

/**
 * Un archivo del informe: lo que se descarga.
 *
 * No transporta el contenido ni una URL firmada. El `fileId` va a
 * `GET /common/files/{id}/content`, que ya resuelve bytes, tipo y nombre y que
 * ya decide si quien pide puede descargarlo. Duplicar acá esa descarga sería
 * una segunda implementación de algo que funciona.
 */
export class DiagnosticResultFileDto {
  /** Identificador del enlace informe↔archivo. */
  @ApiProperty({ format: 'uuid' }) id!: string;

  /** Archivo en `common.files`; se descarga por `/common/files/{id}/content`. */
  @ApiProperty({ format: 'uuid' }) fileId!: string;

  /** Qué es el archivo dentro del informe (concept id). */
  @ApiProperty({ format: 'uuid' }) contentRoleConceptId!: string;

  /** Formato de presentación (concept id), si se declaró. */
  @ApiPropertyOptional({ format: 'uuid' })
  presentationFormatConceptId?: string;

  /** Posición dentro del informe. */
  @ApiPropertyOptional() ordinal?: number;
}

/**
 * Un resultado que el paciente puede ver.
 *
 * Es el informe **y** su versión liberada juntos, no el informe solo: lo que
 * una persona llama «mi resultado» es el texto firmado y sus archivos, y ésos
 * viven en la versión. Un informe sin versión liberada no aparece en esta
 * lista — no está oculto por error, es que todavía no lo validó nadie.
 */
export class PatientDiagnosticResultDto {
  /** Informe (`clinical.diagnostic_reports`). */
  @ApiProperty({ format: 'uuid' }) reportId!: string;

  /** Versión liberada que se está mostrando. */
  @ApiProperty({ format: 'uuid' }) versionId!: string;

  /** Número de esa versión; una enmienda posterior tiene un número mayor. */
  @ApiProperty() versionNumber!: number;

  /** Orden que lo originó, si cuelga de una. */
  @ApiPropertyOptional({ format: 'uuid' }) serviceRequestId?: string;

  /** Qué informa (concept id). */
  @ApiProperty({ format: 'uuid' }) codeConceptId!: string;

  /** Laboratorio o imagenología (concept id). */
  @ApiPropertyOptional({ format: 'uuid' }) categoryConceptId?: string;

  /** Organización que lo emitió y lo custodia. */
  @ApiProperty({ format: 'uuid' }) custodianTenantId!: string;

  /** Conclusión firmada, si la versión la trae. */
  @ApiPropertyOptional() conclusionText?: string;

  /** Cuándo se emitió la versión. */
  @ApiPropertyOptional({ type: String, format: 'date-time' }) issuedAt?: Date;

  /** Cuándo se liberó al paciente. */
  @ApiProperty({ type: String, format: 'date-time' }) releasedAt!: Date;

  /** Estado clínico de la versión (concept id). */
  @ApiProperty({ format: 'uuid' }) clinicalStatusConceptId!: string;

  /** Observaciones enlazadas a la versión. */
  @ApiProperty({ type: [String], format: 'uuid' })
  observationIds!: string[];

  /** Archivos descargables de la versión. */
  @ApiProperty({ type: [DiagnosticResultFileDto] })
  files!: DiagnosticResultFileDto[];
}

/**
 * Los resultados liberados de una persona.
 *
 * `truncated` dice si el tope recortó la lista, con el mismo criterio que el
 * resto de las lecturas del producto: una lista recortada en silencio es una
 * lista que miente.
 */
export class PatientDiagnosticResultsResponseDto {
  /** Paciente leído. */
  @ApiProperty({ format: 'uuid' }) patientProfileId!: string;

  /** Resultados liberados, del más nuevo al más viejo. */
  @ApiProperty({ type: [PatientDiagnosticResultDto] })
  items!: PatientDiagnosticResultDto[];

  /** Tope aplicado. */
  @ApiProperty() limit!: number;

  /** La lista quedó recortada por el tope. */
  @ApiProperty() truncated!: boolean;
}

/**
 * Compartir un resultado con un profesional, por un plazo.
 *
 * El plazo es obligatorio y no tiene valor por defecto: «compartir para
 * siempre» no es lo que pide el requisito —dice *temporalmente*— y elegir un
 * vencimiento por la persona sería inventar una política de retención que el
 * producto no fijó.
 */
export class ShareDiagnosticResultDto {
  /**
   * Cuenta del profesional con quien se comparte.
   *
   * Es el `iam.users.id`, que es el sujeto que el grant entiende y contra el
   * que se resuelve el acceso cuando esa persona abre el informe.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  practitionerUserId!: string;

  /** Hasta cuándo puede verlo. Pasado ese instante, el grant deja de valer. */
  @ApiProperty({ type: String, format: 'date-time' })
  @Type(() => Date)
  @IsDate()
  validUntil!: Date;

  /** Por qué se comparte. Queda en el registro, no en el grant. */
  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

/** Un resultado compartido: con quién y hasta cuándo. */
export class DiagnosticResultShareDto {
  /** Identificador del grant. */
  @ApiProperty({ format: 'uuid' }) id!: string;

  /** Informe compartido. */
  @ApiProperty({ format: 'uuid' }) reportId!: string;

  /** Cuenta del profesional con quien se compartió. */
  @ApiProperty({ format: 'uuid' }) practitionerUserId!: string;

  /** Desde cuándo vale. */
  @ApiProperty({ type: String, format: 'date-time' }) validFrom!: Date;

  /** Hasta cuándo vale. */
  @ApiPropertyOptional({ type: String, format: 'date-time' }) validTo?: Date;

  /** Si el grant está vigente en este momento. */
  @ApiProperty() active!: boolean;
}

/** Los profesionales con los que un resultado está o estuvo compartido. */
export class DiagnosticResultSharesResponseDto {
  /** Informe consultado. */
  @ApiProperty({ format: 'uuid' }) reportId!: string;

  /** Los compartidos, del más nuevo al más viejo. */
  @ApiProperty({ type: [DiagnosticResultShareDto] })
  items!: DiagnosticResultShareDto[];
}
