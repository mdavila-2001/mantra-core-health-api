import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import {
  DerivativeType,
  FileCategory,
  FileSensitivity,
  LinkRole,
  LinkVisibility,
  OwnerType,
  ScanResult,
} from './enums';

/** Cuerpo de `POST /common/files` (crea el archivo y su versión 1). */
export class CreateFileDto {
  /**
   * Valor de original name mantenido por la instancia.
   */
  @ApiProperty()
  @IsString()
  @MaxLength(512)
  originalName!: string;

  /**
   * Valor de category mantenido por la instancia.
   */
  @ApiProperty({ enum: FileCategory })
  @IsEnum(FileCategory)
  category!: FileCategory;

  /**
   * Valor de sensitivity mantenido por la instancia.
   */
  @ApiProperty({ enum: FileSensitivity })
  @IsEnum(FileSensitivity)
  sensitivity!: FileSensitivity;

  /**
   * Valor de mime type mantenido por la instancia.
   */
  @ApiProperty()
  @IsString()
  @MaxLength(255)
  mimeType!: string;

  /**
   * Valor de size bytes mantenido por la instancia.
   */
  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  sizeBytes!: number;

  /**
   * Valor de content hash mantenido por la instancia.
   */
  @ApiProperty()
  @IsString()
  @MaxLength(255)
  contentHash!: string;

  /**
   * Valor de storage uri mantenido por la instancia.
   */
  @ApiProperty()
  @IsString()
  @MaxLength(2048)
  storageUri!: string;
}

/** Cuerpo de `POST /common/files/:id/versions`. */
export class CreateFileVersionDto {
  /**
   * Valor de mime type mantenido por la instancia.
   */
  @ApiProperty()
  @IsString()
  @MaxLength(255)
  mimeType!: string;

  /**
   * Valor de size bytes mantenido por la instancia.
   */
  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  sizeBytes!: number;

  /**
   * Valor de content hash mantenido por la instancia.
   */
  @ApiProperty()
  @IsString()
  @MaxLength(255)
  contentHash!: string;

  /**
   * Valor de storage uri mantenido por la instancia.
   */
  @ApiProperty()
  @IsString()
  @MaxLength(2048)
  storageUri!: string;
}

/** Cuerpo de `POST /common/files/:id/versions/:vid/derivatives`. */
export class CreateFileDerivativeDto {
  /**
   * Valor de derivative type mantenido por la instancia.
   */
  @ApiProperty({ enum: DerivativeType })
  @IsEnum(DerivativeType)
  derivativeType!: DerivativeType;

  /**
   * Valor de storage uri mantenido por la instancia.
   */
  @ApiProperty()
  @IsString()
  @MaxLength(2048)
  storageUri!: string;

  /**
   * Valor de mime type mantenido por la instancia.
   */
  @ApiProperty()
  @IsString()
  @MaxLength(255)
  mimeType!: string;

  /**
   * Valor de size bytes mantenido por la instancia.
   */
  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  sizeBytes!: number;

  /**
   * Valor de content hash mantenido por la instancia.
   */
  @ApiProperty()
  @IsString()
  @MaxLength(255)
  contentHash!: string;
}

/** Cuerpo de `POST /common/files/:id/links`. */
export class CreateFileLinkDto {
  /**
   * Valor de owner type mantenido por la instancia.
   */
  @ApiProperty({ enum: OwnerType })
  @IsEnum(OwnerType)
  ownerType!: OwnerType;

  /**
   * Identificador asociado a owner.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  ownerId!: string;

  /**
   * Valor de link role mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: LinkRole })
  @IsOptional()
  @IsEnum(LinkRole)
  linkRole?: LinkRole;

  /**
   * Valor de visibility mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: LinkVisibility })
  @IsOptional()
  @IsEnum(LinkVisibility)
  visibility?: LinkVisibility;
}

/** Cuerpo de `POST /internal/files/versions/:vid/scan-result`. */
export class ScanResultDto {
  /**
   * Valor de result mantenido por la instancia.
   */
  @ApiProperty({ enum: ScanResult })
  @IsEnum(ScanResult)
  result!: ScanResult;
}

/** Representación segura de un archivo. */
export class FileResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a current version.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  currentVersionId?: string;

  /**
   * Valor de original name mantenido por la instancia.
   */
  @ApiPropertyOptional()
  originalName?: string;

  /**
   * Valor de category mantenido por la instancia.
   */
  @ApiProperty({ enum: FileCategory })
  category!: FileCategory;

  /**
   * Valor de sensitivity mantenido por la instancia.
   */
  @ApiProperty({ enum: FileSensitivity })
  sensitivity!: FileSensitivity;

  /**
   * Identificador asociado a lifecycle status concept.
   */
  @ApiProperty({ description: 'Estado del ciclo de vida (concept id).' })
  lifecycleStatusConceptId!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty()
  createdAt!: Date;
}

/** Representación segura de una versión de archivo. */
export class FileVersionResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a file.
   */
  @ApiProperty({ format: 'uuid' })
  fileId!: string;

  /**
   * Valor de version number mantenido por la instancia.
   */
  @ApiProperty()
  versionNumber!: number;

  /**
   * Valor de mime type mantenido por la instancia.
   */
  @ApiProperty()
  mimeType!: string;

  /**
   * Valor de size bytes mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Tamaño en bytes (bigint serializado como string).',
  })
  sizeBytes!: string;

  /**
   * Valor de content hash mantenido por la instancia.
   */
  @ApiProperty()
  contentHash!: string;

  /**
   * Identificador asociado a malware scan status concept.
   */
  @ApiProperty({ description: 'Estado del escaneo antimalware (concept id).' })
  malwareScanStatusConceptId!: string;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @ApiProperty()
  recordedAt!: Date;
}

/** Representación de un derivado recién creado. */
export class FileDerivativeResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a source file version.
   */
  @ApiProperty({ format: 'uuid' })
  sourceFileVersionId!: string;

  /**
   * Identificador asociado a derivative file version.
   */
  @ApiProperty({ format: 'uuid' })
  derivativeFileVersionId!: string;

  /**
   * Valor de derivative type mantenido por la instancia.
   */
  @ApiProperty({ enum: DerivativeType })
  derivativeType!: DerivativeType;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty()
  createdAt!: Date;
}

/** Representación de un vínculo de archivo. */
export class FileLinkResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a file.
   */
  @ApiProperty({ format: 'uuid' })
  fileId!: string;

  /**
   * Identificador asociado a owner.
   */
  @ApiProperty({ format: 'uuid' })
  ownerId!: string;

  /**
   * Valor de owner type mantenido por la instancia.
   */
  @ApiProperty({ enum: OwnerType })
  ownerType!: OwnerType;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty()
  createdAt!: Date;
}

/** Resultado del borrado lógico de un archivo. */
export class DeleteFileResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Fecha y hora de la eliminación lógica, si corresponde.
   */
  @ApiProperty()
  deletedAt!: Date;
}

/** URL firmada de descarga. */
export class DownloadUrlResponseDto {
  /**
   * Valor de url mantenido por la instancia.
   */
  @ApiProperty({ description: 'URL de descarga firmada (simulada).' })
  url!: string;

  /**
   * Valor de expires at mantenido por la instancia.
   */
  @ApiProperty()
  expiresAt!: Date;
}
