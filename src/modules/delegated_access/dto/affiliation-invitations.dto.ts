import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { SUPPORT_TEMPLATE_CODES, type SupportTemplateCode } from '../domain';

const KINDS = ['PRACTITIONER', 'SUPPORT_STAFF'] as const;

/** Cuerpo de `POST /org/affiliation-invitations`: código o QR de afiliación. */
export class CreateAffiliationInvitationDto {
  /** A quién sirve: doctores o personal de apoyo. */
  @ApiProperty({ enum: KINDS })
  @IsIn(KINDS)
  kind!: (typeof KINDS)[number];

  /**
   * Persona específica; con ella la invitación es de un solo uso y afilia
   * directo. Sin ella (multiuso) el canje NO afilia solo: queda pendiente de
   * aprobación de la organización, sea de doctores o de personal de apoyo.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  targetPersonId?: string;

  /** Usos máximos (1-500); sin persona específica admite varios. */
  @ApiPropertyOptional({ minimum: 1, maximum: 500 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  maxUses?: number;

  /** Días de vigencia (1-90); por defecto 15. */
  @ApiPropertyOptional({ minimum: 1, maximum: 90 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(90)
  expiresInDays?: number;

  /** Plantilla de rol; obligatoria para `SUPPORT_STAFF`. */
  @ApiPropertyOptional({ enum: SUPPORT_TEMPLATE_CODES })
  @IsOptional()
  @IsIn(SUPPORT_TEMPLATE_CODES)
  roleTemplateCode?: SupportTemplateCode;
}

/** Invitación creada; el código se muestra una sola vez. */
export class AffiliationInvitationCreatedDto {
  /** Id de la invitación. */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /** Código para el QR o para escribir; no se vuelve a mostrar. */
  @ApiProperty() code!: string;
  /** Vencimiento. */
  @ApiProperty({ type: String, format: 'date-time' }) expiresAt!: Date;
  /** Usos máximos. */
  @ApiProperty() maxUses!: number;
}

/** Cuerpo de `POST /affiliation-invitations/redeem`. */
export class RedeemAffiliationInvitationDto {
  /** Código de la invitación. */
  @ApiProperty({ minLength: 8, maxLength: 200 })
  @IsString()
  @MinLength(8)
  @MaxLength(200)
  code!: string;
}

/** Resultado de canjear una invitación. */
export class AffiliationRedeemResultDto {
  /** Tipo de invitación canjeada. */
  @ApiProperty({ enum: KINDS }) kind!: (typeof KINDS)[number];
  /** Organización a la que quedó afiliada la persona (o a la que pidió afiliarse). */
  @ApiProperty({ format: 'uuid' }) tenantId!: string;
  /** Membresía creada o reutilizada; ausente si el canje quedó pendiente de aprobación. */
  @ApiPropertyOptional({ format: 'uuid' }) membershipId?: string;
  /** Vínculo de apoyo abierto, para `SUPPORT_STAFF` con código dirigido a la persona. */
  @ApiPropertyOptional({ format: 'uuid' }) engagementId?: string;
  /**
   * Solicitud que quedó pendiente de aprobación (personal de apoyo): un código
   * multiuso (sin persona destino) no afilia solo, la organización decide.
   */
  @ApiPropertyOptional({ format: 'uuid' }) requestId?: string;
  /**
   * Solicitud de afiliación que quedó pendiente (doctor que canjea un código
   * multiuso): es la fila de `practice.practitioner_role_assignments` en `PENDING`
   * que la organización aprueba o rechaza con
   * `POST /role-assignments/:roleAssignmentId/approve|reject` y ve en
   * `GET /practices/:practiceId/role-assignments`.
   */
  @ApiPropertyOptional({ format: 'uuid' }) roleAssignmentId?: string;
  /** `true` si el canje espera la decisión de la organización (apoyo o doctor). */
  @ApiPropertyOptional() pendingApproval?: boolean;
}

/** Una invitación de la organización, sin su código. */
export class AffiliationInvitationViewDto {
  /** Id de la invitación. */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /** A quién invita. */
  @ApiProperty({ enum: KINDS }) kind!: (typeof KINDS)[number];
  /** Persona específica a la que va dirigida, si la hay. */
  @ApiPropertyOptional({ format: 'uuid' }) targetPersonId?: string;
  /** Plantilla de rol, para personal de apoyo. */
  @ApiPropertyOptional() roleTemplateCode?: string;
  /** Usos máximos. */
  @ApiProperty() maxUses!: number;
  /** Veces que se canjeó. */
  @ApiProperty() usesCount!: number;
  /** Vencimiento. */
  @ApiProperty({ type: String, format: 'date-time' }) expiresAt!: Date;
  /** Estado efectivo: activa, agotada, vencida o revocada. */
  @ApiProperty({ enum: ['ACTIVE', 'EXHAUSTED', 'EXPIRED', 'REVOKED'] })
  status!: 'ACTIVE' | 'EXHAUSTED' | 'EXPIRED' | 'REVOKED';
  /** Cuándo se creó. */
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: Date;
}

/** Respuesta de `GET /org/affiliation-invitations`. */
export class ListAffiliationInvitationsResponseDto {
  /** Invitaciones de la organización. */
  @ApiProperty({ type: [AffiliationInvitationViewDto] })
  items!: AffiliationInvitationViewDto[];
}
