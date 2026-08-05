import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsUUID, Matches } from 'class-validator';

/** Patrón de `documentType`: minúsculas, dígitos y separadores acotados. */
const DOCUMENT_TYPE_RE = /^[a-z][a-z0-9_.-]{1,60}$/;

/**
 * Cuerpo de `POST /document-store/collections/:collection/documents`.
 *
 * El `tenantId` viaja explícito en el cuerpo (scoping por tenant) hasta que se
 * derive del contexto de sesión. El `payload` es libre por diseño -es el valor
 * del almacén flexible-, pero se exige que sea un objeto para no almacenar
 * escalares sueltos.
 */
export class CreateFlexibleDocumentDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({
    description: 'Tenant propietario del documento',
    format: 'uuid',
  })
  @IsUUID()
  tenantId!: string;

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
  payload!: Record<string, unknown>;
}
