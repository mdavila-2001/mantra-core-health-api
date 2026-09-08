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

/**
 * Un check del caso, tal como quedó, para armar el trace visual del veredicto
 * (FT-32-R05). No es el registro append-only completo: sólo lo que explica
 * "qué se revisó y cómo salió".
 */
export class CaseCheckDto {
  /**
   * Identificador asociado a check type concept.
   */
  @ApiProperty({ format: 'uuid' })
  checkTypeConceptId!: string;

  /**
   * Identificador asociado a status concept del check.
   */
  @ApiProperty({ format: 'uuid' })
  status!: string;

  /**
   * Resultado del check, cuando ya corrió (`identity_check_results`).
   */
  @ApiPropertyOptional({ format: 'uuid' })
  resultConceptId?: string;

  /**
   * Cuándo se registró ese resultado.
   */
  @ApiPropertyOptional()
  checkedAt?: Date;
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
   * Código del tipo de solicitud (catálogo de autoservicio de identidad):
   * `PRACTITIONER_IDENTITY`, `PRACTITIONER_LICENSE`, `PATIENT_IDENTITY`,
   * `TENANT_VERIFICATION`, o `UNKNOWN` si el sujeto no se reconoce.
   */
  @ApiProperty({
    description: 'Tipo de solicitud, derivado del sujeto del caso',
  })
  type!: string;

  /**
   * Archivo de evidencia aportado con la solicitud (`common.files`).
   *
   * Se descarga con `GET /common/files/:id/content`, que ya exige ser quien lo
   * subió o tener un rol revisor: no hace falta un endpoint de descarga propio.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  evidenceFileId?: string;

  /**
   * Motivo registrado por quien decidió el caso en revisión manual, cuando lo
   * hubo. Un caso resuelto automáticamente (sin escalar) no tiene motivo de
   * texto: el trace de `checks` es la explicación disponible en ese caso.
   */
  @ApiPropertyOptional()
  reasonText?: string;

  /**
   * Traza de los checks del caso, del planificado al más reciente. Sólo se
   * completa en la consulta de detalle (`getOwnCaseStatus`); la lista no la
   * trae para no pagar N+1 por fila que nadie mira.
   */
  @ApiPropertyOptional({ type: [CaseCheckDto] })
  checks?: CaseCheckDto[];

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

/** Un tipo de solicitud de verificación disponible para el titular (FT-32). */
export class VerificationTypeDto {
  /** Código estable del tipo, el mismo que `VerificationStatusResponseDto.type`. */
  @ApiProperty()
  code!: string;

  /** Etiqueta legible para el selector de "nueva solicitud". */
  @ApiProperty()
  label!: string;

  /**
   * Matrícula concreta a la que aplica este tipo, sólo para
   * `PRACTITIONER_LICENSE`: un profesional puede tener más de una.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  jurisdictionAuthorizationId?: string;

  /**
   * Ya hay una solicitud viva (abierta o en verificación) para este tipo
   * concreto. El backend igual rechaza con 409 si se manda de todas formas:
   * esto es lo que deja a la pantalla no ofrecer el envío desde antes.
   */
  @ApiProperty()
  hasPendingRequest!: boolean;
}

/** Catálogo de tipos de solicitud disponibles para "nueva solicitud" (FT-32-R09). */
export class VerificationTypesResponseDto {
  @ApiProperty({ type: [VerificationTypeDto] })
  types!: VerificationTypeDto[];
}
