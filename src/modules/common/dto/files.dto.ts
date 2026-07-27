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
  @ApiProperty()
  @IsString()
  @MaxLength(512)
  originalName!: string;

  @ApiProperty({ enum: FileCategory })
  @IsEnum(FileCategory)
  category!: FileCategory;

  @ApiProperty({ enum: FileSensitivity })
  @IsEnum(FileSensitivity)
  sensitivity!: FileSensitivity;

  @ApiProperty()
  @IsString()
  @MaxLength(255)
  mimeType!: string;

  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  sizeBytes!: number;

  @ApiProperty()
  @IsString()
  @MaxLength(255)
  contentHash!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(2048)
  storageUri!: string;
}

/** Cuerpo de `POST /common/files/:id/versions`. */
export class CreateFileVersionDto {
  @ApiProperty()
  @IsString()
  @MaxLength(255)
  mimeType!: string;

  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  sizeBytes!: number;

  @ApiProperty()
  @IsString()
  @MaxLength(255)
  contentHash!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(2048)
  storageUri!: string;
}

/** Cuerpo de `POST /common/files/:id/versions/:vid/derivatives`. */
export class CreateFileDerivativeDto {
  @ApiProperty({ enum: DerivativeType })
  @IsEnum(DerivativeType)
  derivativeType!: DerivativeType;

  @ApiProperty()
  @IsString()
  @MaxLength(2048)
  storageUri!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(255)
  mimeType!: string;

  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  sizeBytes!: number;

  @ApiProperty()
  @IsString()
  @MaxLength(255)
  contentHash!: string;
}

/** Cuerpo de `POST /common/files/:id/links`. */
export class CreateFileLinkDto {
  @ApiProperty({ enum: OwnerType })
  @IsEnum(OwnerType)
  ownerType!: OwnerType;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  ownerId!: string;

  @ApiPropertyOptional({ enum: LinkRole })
  @IsOptional()
  @IsEnum(LinkRole)
  linkRole?: LinkRole;

  @ApiPropertyOptional({ enum: LinkVisibility })
  @IsOptional()
  @IsEnum(LinkVisibility)
  visibility?: LinkVisibility;
}

/** Cuerpo de `POST /internal/files/versions/:vid/scan-result`. */
export class ScanResultDto {
  @ApiProperty({ enum: ScanResult })
  @IsEnum(ScanResult)
  result!: ScanResult;
}

/** Representación segura de un archivo. */
export class FileResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  currentVersionId?: string;

  @ApiPropertyOptional()
  originalName?: string;

  @ApiProperty({ enum: FileCategory })
  category!: FileCategory;

  @ApiProperty({ enum: FileSensitivity })
  sensitivity!: FileSensitivity;

  @ApiProperty({ description: 'Estado del ciclo de vida (concept id).' })
  lifecycleStatusConceptId!: string;

  @ApiProperty()
  createdAt!: Date;
}

/** Representación segura de una versión de archivo. */
export class FileVersionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  fileId!: string;

  @ApiProperty()
  versionNumber!: number;

  @ApiProperty()
  mimeType!: string;

  @ApiProperty({
    description: 'Tamaño en bytes (bigint serializado como string).',
  })
  sizeBytes!: string;

  @ApiProperty()
  contentHash!: string;

  @ApiProperty({ description: 'Estado del escaneo antimalware (concept id).' })
  malwareScanStatusConceptId!: string;

  @ApiProperty()
  recordedAt!: Date;
}

/** Representación de un derivado recién creado. */
export class FileDerivativeResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  sourceFileVersionId!: string;

  @ApiProperty({ format: 'uuid' })
  derivativeFileVersionId!: string;

  @ApiProperty({ enum: DerivativeType })
  derivativeType!: DerivativeType;

  @ApiProperty()
  createdAt!: Date;
}

/** Representación de un vínculo de archivo. */
export class FileLinkResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  fileId!: string;

  @ApiProperty({ format: 'uuid' })
  ownerId!: string;

  @ApiProperty({ enum: OwnerType })
  ownerType!: OwnerType;

  @ApiProperty()
  createdAt!: Date;
}

/** Resultado del borrado lógico de un archivo. */
export class DeleteFileResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  deletedAt!: Date;
}

/** URL firmada de descarga. */
export class DownloadUrlResponseDto {
  @ApiProperty({ description: 'URL de descarga firmada (simulada).' })
  url!: string;

  @ApiProperty()
  expiresAt!: Date;
}
