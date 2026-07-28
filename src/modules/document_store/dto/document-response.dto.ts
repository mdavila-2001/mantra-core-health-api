import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { StoredDocument } from '../repositories';

/**
 * Vista pública de un documento almacenado. Traduce el `_id` de Mongo a un `id`
 * hexadecimal de cadena para no filtrar el tipo `ObjectId` del driver al cliente.
 */
export class DocumentResponseDto {
  @ApiProperty({ description: 'Identificador del documento (ObjectId hex)' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty()
  documentType!: string;

  @ApiProperty({ type: 'object', additionalProperties: true })
  payload!: Record<string, unknown>;

  @ApiProperty({ description: 'Versión vigente (concurrencia optimista)' })
  version!: number;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    nullable: true,
    description: 'Marca de borrado lógico; null si el documento está vivo',
  })
  deletedAt!: Date | null;

  /** Construye la respuesta a partir del documento persistido. */
  static from(doc: StoredDocument): DocumentResponseDto {
    const dto = new DocumentResponseDto();
    dto.id = doc._id.toHexString();
    dto.tenantId = doc.tenantId;
    dto.documentType = doc.documentType;
    dto.payload = doc.payload;
    dto.version = doc.version;
    dto.createdAt = doc.createdAt;
    dto.updatedAt = doc.updatedAt;
    dto.deletedAt = doc.deletedAt;
    return dto;
  }
}
