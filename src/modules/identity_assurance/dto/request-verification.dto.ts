import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

/**
 * Cuerpo común de las solicitudes de verificación de autoservicio.
 *
 * Sólo lleva la evidencia: a quién se verifica NO se declara, se resuelve del
 * usuario autenticado. Aceptarlo en el cuerpo permitiría pedir la verificación
 * de la identidad de otro.
 */
@ApiSchema({ name: 'IdentityAssuranceRequestVerificationDto' })
export class RequestVerificationDto {
  /**
   * Archivo con la evidencia (`common.files`), p. ej. la foto con el carnet.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Archivo de evidencia ya subido a POST /common/files/upload',
  })
  @IsUUID()
  evidenceFileId!: string;
}

/** Cuerpo de la solicitud de verificación de matrícula profesional. */
@ApiSchema({ name: 'IdentityAssuranceRequestLicenseVerificationDto' })
export class RequestLicenseVerificationDto extends RequestVerificationDto {
  /**
   * Autorización jurisdiccional (matrícula) que se quiere verificar.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Matrícula a verificar. Si se omite se usa la única del profesional.',
  })
  @IsOptional()
  @IsUUID()
  jurisdictionAuthorizationId?: string;
}

/** Lo que devuelve una solicitud de verificación aceptada. */
export class VerificationRequestResponseDto {
  /**
   * Identificador asociado a case.
   */
  @ApiProperty({ format: 'uuid' })
  caseId!: string;

  /**
   * Identificador asociado a check.
   */
  @ApiProperty({ format: 'uuid' })
  checkId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Estado del caso recién abierto',
  })
  status!: string;
}

/** Estado consultable de un caso de verificación propio. */
export class VerificationStatusResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  status!: string;

  /**
   * Valor de opened at mantenido por la instancia.
   */
  @ApiPropertyOptional()
  openedAt?: Date;

  /**
   * Valor de completed at mantenido por la instancia.
   */
  @ApiPropertyOptional()
  completedAt?: Date;
}
