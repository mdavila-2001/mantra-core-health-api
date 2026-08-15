import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/** Alta de un documento en el repositorio legal y regulatorio (UC-17-31). */
export class CreateRegulatoryDocumentDto {
  /**
   * Nombre del documento.
   */
  @ApiProperty()
  @IsString()
  @MaxLength(255)
  name!: string;

  /**
   * Tipo documental.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  documentTypeConceptId!: string;

  /**
   * Código.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(128)
  code?: string;

  /**
   * Versión inicial.
   */
  @ApiProperty({ example: 'v1' })
  @IsString()
  @MaxLength(32)
  version!: string;

  /**
   * Entidad emisora.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  issuerName?: string;

  /**
   * Fecha de emisión.
   */
  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsDateString()
  issuedOn?: string;

  /**
   * Fecha de vencimiento.
   */
  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsDateString()
  expiresOn?: string;

  /**
   * Producto al que respalda.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  pharmaProductId?: string;

  /**
   * Visitador al que respalda.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  medicalVisitorId?: string;

  /**
   * Responsable.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  ownerStaffId?: string;

  /**
   * Nivel de confidencialidad.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  disclosureLevelConceptId!: string;

  /**
   * Días de antelación para la alerta de vencimiento.
   */
  @ApiPropertyOptional({ minimum: 1, maximum: 365 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  expiryAlertDays?: number;

  /**
   * Nombre visible del archivo de la versión inicial.
   */
  @ApiProperty()
  @IsString()
  @MaxLength(255)
  fileName!: string;

  /**
   * Referencia del archivo en el almacén.
   */
  @ApiProperty()
  @IsString()
  @MaxLength(512)
  storageKey!: string;

  /**
   * Tipo MIME.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(128)
  contentType?: string;
}

/** Sustitución de un documento por una versión nueva (UC-17-32). */
export class AddDocumentVersionDto {
  /**
   * Etiqueta de la versión nueva.
   */
  @ApiProperty({ example: 'v2' })
  @IsString()
  @MaxLength(32)
  version!: string;

  /**
   * Nombre visible del archivo.
   */
  @ApiProperty()
  @IsString()
  @MaxLength(255)
  fileName!: string;

  /**
   * Referencia del archivo en el almacén.
   */
  @ApiProperty()
  @IsString()
  @MaxLength(512)
  storageKey!: string;

  /**
   * Tipo MIME.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(128)
  contentType?: string;

  /**
   * Fecha de emisión de la versión nueva.
   */
  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsDateString()
  issuedOn?: string;

  /**
   * Fecha de vencimiento de la versión nueva.
   */
  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsDateString()
  expiresOn?: string;

  /**
   * Motivo de la sustitución.
   */
  @ApiProperty()
  @IsString()
  @MaxLength(1000)
  changeReason!: string;
}

/** Invalidación de un documento (UC-17-33). No lo borra: lo marca. */
export class InvalidateDocumentDto {
  /**
   * Motivo de la invalidación.
   */
  @ApiProperty()
  @IsString()
  @MaxLength(1000)
  reason!: string;
}
