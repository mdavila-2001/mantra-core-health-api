import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

/** Decisión de verificación de una credencial. */
export type CredentialDecision = 'VERIFIED' | 'REJECTED';

/** Cuerpo de `POST /profiles/credentials/{credentialId}/verify` (UC-05-05). */
export class VerifyCredentialDto {
  /**
   * Valor de decision mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Resultado de la verificación',
    enum: ['VERIFIED', 'REJECTED'],
  })
  @IsIn(['VERIFIED', 'REJECTED'])
  decision!: CredentialDecision;

  /**
   * Valor de verification source uri mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description:
      'URI de la fuente de verificación consultada (registro del colegio ' +
      'profesional, resolución de la autoridad). OBLIGATORIA cuando la ' +
      'decisión es VERIFIED: habilitar a un profesional sin declarar contra ' +
      'qué se comprobó su matrícula no deja rastro auditable. Para REJECTED ' +
      'es opcional, porque se puede rechazar por defectos de forma del propio ' +
      'documento sin consultar a nadie.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  verificationSourceUri?: string;
}

/** Respuesta de verificación de credencial. */
export class CredentialResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de state mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Concept id del estado de la credencial',
    format: 'uuid',
  })
  state!: string;

  /**
   * Valor de verified at mantenido por la instancia.
   */
  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  verifiedAt?: Date;

  /**
   * Valor de practitioner verified mantenido por la instancia.
   */
  @ApiProperty({
    description:
      'true si al verificar quedó habilitado todo el perfil profesional',
  })
  practitionerVerified!: boolean;
}

/** Una credencial en la cola de verificación (CV-20). */
export class PendingCredentialSummaryDto {
  /** Identificador único de la instancia. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Profesional dueño de la credencial. */
  @ApiProperty({ format: 'uuid' })
  practitionerProfileId!: string;

  /** Concepto del tipo de credencial (matrícula, título, certificación). */
  @ApiProperty({ format: 'uuid' })
  credentialTypeConceptId!: string;

  /** Número de matrícula o de documento declarado. */
  @ApiProperty()
  number!: string;

  /** Institución u organismo emisor, en texto libre. */
  @ApiPropertyOptional()
  issuingInstitutionText?: string;

  /** Archivo adjunto (diploma o certificado), si se cargó uno. */
  @ApiPropertyOptional({ format: 'uuid' })
  fileId?: string;

  /** Estado actual de la credencial. */
  @ApiProperty({ format: 'uuid' })
  state!: string;

  /** Fecha en que se cargó la credencial. */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

/** Página de la cola de verificación de credenciales. */
export class ListPendingCredentialsResponseDto {
  /** Credenciales de esta página, ordenadas por `id`. */
  @ApiProperty({ type: [PendingCredentialSummaryDto] })
  items!: PendingCredentialSummaryDto[];

  /** Cantidad devuelta en esta página. */
  @ApiProperty() count!: number;

  /** Tope aplicado a la consulta. */
  @ApiProperty() limit!: number;

  /** Cursor opaco de continuación, o `null` si ésta es la última página. */
  @ApiProperty({ nullable: true, type: String })
  nextCursor!: string | null;
}
