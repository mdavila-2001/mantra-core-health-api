import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsObject,
  IsOptional,
  IsUUID,
  Matches,
  Min,
} from 'class-validator';

const DOCUMENT_TYPE_RE = /^[a-z][a-z0-9_.-]{1,60}$/;

/**
 * Cuerpo de `PATCH /document-store/collections/:collection/documents/:id`.
 *
 * `expectedVersion` implementa la concurrencia optimista: el actualizador
 * declara la versión que cree vigente y la operación falla si ya cambió. Al
 * menos uno de `payload`/`documentType` debe venir; el servicio lo valida.
 */
export class UpdateDocumentDto {
  @ApiProperty({ description: 'Tenant propietario del documento', format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({
    description: 'Versión que el cliente cree vigente (concurrencia optimista)',
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  expectedVersion!: number;

  @ApiPropertyOptional({
    description: 'Nuevo contenido flexible del documento',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Nueva clasificación del documento' })
  @IsOptional()
  @Matches(DOCUMENT_TYPE_RE, {
    message:
      'documentType debe empezar por minúscula y usar sólo [a-z0-9_.-] (2-61 chars)',
  })
  documentType?: string;
}
