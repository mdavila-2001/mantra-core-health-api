import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { StoredDocument } from '../repositories';

/**
 * Vista pública de un documento almacenado. Traduce el `_id` de Mongo a un `id`
 * hexadecimal de cadena para no filtrar el tipo `ObjectId` del driver al cliente.
 */
export class DocumentResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ description: 'Identificador del documento (ObjectId hex)' })
  id!: string;

  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  /**
   * Valor de document type mantenido por la instancia.
   */
  @ApiProperty()
  documentType!: string;

  /**
   * Valor de payload mantenido por la instancia.
   */
  @ApiProperty({ type: 'object', additionalProperties: true })
  payload!: Record<string, unknown>;

  /**
   * Valor de version mantenido por la instancia.
   */
  @ApiProperty({ description: 'Versión vigente (concurrencia optimista)' })
  version!: number;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  /**
   * Fecha y hora de la última actualización.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;

  /**
   * Fecha y hora de la eliminación lógica, si corresponde.
   */
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
