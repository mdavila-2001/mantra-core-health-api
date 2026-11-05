import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsUUID,
  Matches,
} from 'class-validator';
import { MaxJsonSize } from '../../../common/validators/max-json-size.validator';

/** Patrón de `documentType`: minúsculas, dígitos y separadores acotados. */
const DOCUMENT_TYPE_RE = /^[a-z][a-z0-9_.-]{1,60}$/;

/**
 * Cuerpo de `POST /document-store/collections/:collection/documents`.
 *
 * El tenant propietario es el del contexto de sesión; un `tenantId` en el cuerpo
 * solo se acepta si coincide. El `payload` es libre por diseño -es el valor
 * del almacén flexible-, pero se exige que sea un objeto para no almacenar
 * escalares sueltos.
 */
export class CreateFlexibleDocumentDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({
    description:
      'Se ignora como fuente de verdad: el tenant es el activo (X-Tenant-Id). Si se envía y no coincide, responde 404',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /**
   * Valor de document type mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Tipo/clasificación del documento (p. ej. fhir_bundle_raw)',
    example: 'fhir_bundle_raw',
  })
  @IsNotEmpty()
  @Matches(DOCUMENT_TYPE_RE, {
    message:
      'documentType debe empezar por minúscula y usar sólo [a-z0-9_.-] (2-61 chars)',
  })
  documentType!: string;

  /**
   * Valor de payload mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Contenido flexible del documento (JSON/semiestructurado)',
    type: 'object',
    additionalProperties: true,
  })
  @IsObject()
  @MaxJsonSize(900 * 1024)
  payload!: Record<string, unknown>;
}
