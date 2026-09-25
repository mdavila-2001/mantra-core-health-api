import { ApiProperty } from '@nestjs/swagger';

/**
 * Lo que devuelve `POST /iam/auth/upload-registration-document`: el `fileId`
 * que el alta de organización (`legalDocuments`) o profesional
 * (`credentials[].fileId`) tiene que reenviar para reclamarlo.
 */
export class RegistrationDocumentUploadResponseDto {
  /**
   * Identificador del archivo, sin dueño hasta que un alta lo reclame.
   */
  @ApiProperty({ format: 'uuid' })
  fileId!: string;

  /**
   * Nombre original del PDF, tal como lo envió el cliente.
   */
  @ApiProperty({ example: 'escritura-de-constitucion.pdf' })
  originalName!: string;

  /**
   * Tamaño real del archivo almacenado, en bytes.
   */
  @ApiProperty({ example: 318_204 })
  sizeBytes!: number;

  /**
   * Tipo MIME detectado por firma binaria (siempre `application/pdf`).
   */
  @ApiProperty({ example: 'application/pdf' })
  mimeType!: string;
}
