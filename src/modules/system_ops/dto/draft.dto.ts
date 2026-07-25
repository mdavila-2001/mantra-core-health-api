import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/** Cuerpo de `POST /admin/governance/drafts` (UC-11-15). */
export class CreateDraftDto {
  @ApiProperty({ description: 'Esquema destino real', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  schemaName!: string;

  @ApiProperty({ description: 'Tabla destino real', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  tableName!: string;

  @ApiPropertyOptional({ description: 'Registro destino a actualizar (si aplica)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  targetRecordId?: string;

  @ApiPropertyOptional({ description: 'Tenant del draft', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  draftLabel?: string;

  @ApiProperty({ description: 'Contenido del borrador (JSON)' })
  @IsObject()
  payloadJson!: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Versión del schema del target' })
  @IsOptional()
  @IsInt()
  @Min(1)
  schemaVersion?: number;
}

/** Cuerpo de `POST /admin/governance/drafts/{id}/publish` (UC-11-15). */
export class PublishDraftDto {
  @ApiProperty({ description: 'Referencia idempotente de la publicación', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  publishReference!: string;
}

/** Respuesta del draft. */
export class DraftResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiPropertyOptional({ description: 'Id del registro materializado al publicar', format: 'uuid' })
  publishedRecordId?: string;
}
