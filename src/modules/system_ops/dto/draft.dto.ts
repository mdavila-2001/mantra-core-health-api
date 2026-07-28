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
  /**
   * Valor de schema name mantenido por la instancia.
   */
  @ApiProperty({ description: 'Esquema destino real', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  schemaName!: string;

  /**
   * Valor de table name mantenido por la instancia.
   */
  @ApiProperty({ description: 'Tabla destino real', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  tableName!: string;

  /**
   * Identificador asociado a target record.
   */
  @ApiPropertyOptional({
    description: 'Registro destino a actualizar (si aplica)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  targetRecordId?: string;

  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({ description: 'Tenant del draft', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /**
   * Valor de draft label mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  draftLabel?: string;

  /**
   * Valor de payload json mantenido por la instancia.
   */
  @ApiProperty({ description: 'Contenido del borrador (JSON)' })
  @IsObject()
  payloadJson!: Record<string, unknown>;

  /**
   * Valor de schema version mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Versión del schema del target' })
  @IsOptional()
  @IsInt()
  @Min(1)
  schemaVersion?: number;
}

/** Cuerpo de `POST /admin/governance/drafts/{id}/publish` (UC-11-15). */
export class PublishDraftDto {
  /**
   * Valor de publish reference mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Referencia idempotente de la publicación',
    maxLength: 200,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  publishReference!: string;
}

/** Respuesta del draft. */
export class DraftResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Identificador asociado a published record.
   */
  @ApiPropertyOptional({
    description: 'Id del registro materializado al publicar',
    format: 'uuid',
  })
  publishedRecordId?: string;
}
