import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
} from 'class-validator';

/** Alta de un medicamento en el catálogo del laboratorio (UC-17-21). */
export class CreatePharmaProductDto {
  /**
   * Nombre comercial.
   */
  @ApiProperty()
  @IsString()
  @MaxLength(255)
  tradeName!: string;

  /**
   * Principio activo.
   */
  @ApiProperty()
  @IsString()
  @MaxLength(255)
  activeIngredient!: string;

  /**
   * Presentación.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  presentation?: string;

  /**
   * Concentración.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(128)
  concentration?: string;

  /**
   * Forma farmacéutica.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(128)
  pharmaceuticalForm?: string;

  /**
   * Vía de administración.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(128)
  administrationRoute?: string;

  /**
   * Indicación autorizada. Solo tiene sentido en productos aprobados.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  authorizedIndication?: string;

  /**
   * Fabricante, cuando difiere del titular.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  manufacturerName?: string;

  /**
   * Estado regulatorio inicial.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  regulatoryStatusConceptId!: string;

  /**
   * Número de registro sanitario.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(128)
  sanitaryRegistryNumber?: string;

  /**
   * Fecha de aprobación.
   */
  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsDateString()
  approvedOn?: string;

  /**
   * Fecha de vencimiento del registro.
   */
  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsDateString()
  registryExpiresOn?: string;

  /**
   * Países autorizados, ISO 3166-1 alfa-2.
   */
  @ApiPropertyOptional({ type: [String], example: ['BO', 'PE'] })
  @IsOptional()
  @IsArray()
  @Length(2, 2, { each: true })
  @ArrayMaxSize(200)
  authorizedCountries?: string[];

  /**
   * Nivel de divulgación.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  disclosureLevelConceptId!: string;
}

/** Actualización de un medicamento (UC-17-22). */
export class UpdatePharmaProductDto {
  /**
   * Presentación.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  presentation?: string;

  /**
   * Concentración.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(128)
  concentration?: string;

  /**
   * Indicación autorizada.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  authorizedIndication?: string;

  /**
   * Número de registro sanitario.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(128)
  sanitaryRegistryNumber?: string;

  /**
   * Fecha de vencimiento del registro.
   */
  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsDateString()
  registryExpiresOn?: string;

  /**
   * Países autorizados.
   */
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @Length(2, 2, { each: true })
  @ArrayMaxSize(200)
  authorizedCountries?: string[];

  /**
   * Nivel de divulgación.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  disclosureLevelConceptId?: string;
}

/** Cambio de estado regulatorio de un medicamento (UC-17-23). */
export class ChangeProductStatusDto {
  /**
   * Nuevo estado regulatorio.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  regulatoryStatusConceptId!: string;

  /**
   * Motivo del cambio.
   */
  @ApiProperty()
  @IsString()
  @MaxLength(500)
  reason!: string;
}

/** Alta de material informativo para doctores (UC-17-24). */
export class CreateInformationalMaterialDto {
  /**
   * Título.
   */
  @ApiProperty()
  @IsString()
  @MaxLength(255)
  title!: string;

  /**
   * Tipo de material.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  kindConceptId!: string;

  /**
   * Versión.
   */
  @ApiProperty({ example: 'v1.0' })
  @IsString()
  @MaxLength(32)
  version!: string;

  /**
   * Medicamento asociado.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  pharmaProductId?: string;

  /**
   * Campaña.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  campaignCode?: string;

  /**
   * Especialidad destinataria.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  specialtyConceptId?: string;

  /**
   * Visitador al que se asigna.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  medicalVisitorId?: string;

  /**
   * Autor.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  authorName?: string;

  /**
   * Inicio de vigencia.
   */
  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  /**
   * Fin de vigencia.
   */
  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsDateString()
  validTo?: string;

  /**
   * Nivel de divulgación.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  disclosureLevelConceptId!: string;
}

/** Adjunto de un material informativo (UC-17-25). */
export class AddMaterialAssetDto {
  /**
   * Tipo del adjunto.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  kindConceptId!: string;

  /**
   * Nombre visible.
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
   * Tamaño en bytes.
   */
  @ApiPropertyOptional({ example: '104857' })
  @IsOptional()
  @IsString()
  sizeBytes?: string;
}

/** Decisión de la revisión interna de un material (UC-17-26). */
export class DecideMaterialDto {
  /**
   * Decisión: aprobado o rechazado.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  decisionConceptId!: string;

  /**
   * Ficha de personal que decide.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  reviewerStaffId?: string;

  /**
   * Fundamento de la decisión.
   */
  @ApiProperty()
  @IsString()
  @MaxLength(1000)
  rationale!: string;
}
