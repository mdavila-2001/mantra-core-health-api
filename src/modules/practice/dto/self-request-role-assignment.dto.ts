import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

/**
 * Cuerpo de `POST /practices/{practiceId}/role-assignments/self-request`
 * (Carril 18). A diferencia de {@link CreateRoleAssignmentDto} (alta
 * administrativa, `SECURITY_ADMIN`), este DTO lo envía el propio profesional:
 * no acepta `practitionerProfileId` ni `isPrimary`/`revenueSharePercent` — esos
 * campos los fija el servicio a partir del actor autenticado y de la revisión
 * de la organización, no de lo que el solicitante declare de sí mismo.
 */
@ApiSchema({ name: 'PracticeSelfRequestRoleAssignmentDto' })
export class SelfRequestRoleAssignmentDto {
  /** Sede donde el profesional pide atender, si ya la conoce. */
  @ApiPropertyOptional({ description: 'Sitio de la práctica', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  practiceSiteId?: string;

  /** Cargo solicitado (por defecto, el rol clínico general). */
  @ApiPropertyOptional({ description: 'Concepto de cargo/rol', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  roleConceptId?: string;

  /** Especialidad con la que se solicita ejercer en esta organización. */
  @ApiPropertyOptional({
    description: 'Concepto de especialidad',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  specialtyConceptId?: string;

  /** Desde cuándo pide empezar a ejercer. */
  @ApiPropertyOptional({ description: 'Vigente desde (ISO date)' })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  /** Nota libre para quien revise la solicitud (p. ej. referencia a un documento de respaldo). */
  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

/** Cuerpo de las transiciones de la vinculación (aprobar/rechazar/suspender/finalizar). */
@ApiSchema({ name: 'PracticeRoleAssignmentTransitionDto' })
export class RoleAssignmentTransitionDto {
  /** Motivo de la decisión, para dejar rastro de por qué la organización decidió así. */
  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

/** Vinculación tal como la ve el propio profesional (`GET /practitioners/me/role-assignments`). */
export class MyRoleAssignmentResponseDto {
  /** Identificador de la vinculación. */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /** Organización (`practice.practices`). */
  @ApiProperty({ format: 'uuid' }) practiceId!: string;
  /** Nombre legible de la organización. */
  @ApiProperty() practiceName!: string;
  /** Tipo de organización (concepto). */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  practiceType!: string | null;
  /** Sede, si la vinculación la declara. */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  practiceSiteId!: string | null;
  /** Cargo. */
  @ApiProperty({ format: 'uuid' }) roleConceptId!: string;
  /** Especialidad, si la vinculación la declara. */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  specialtyConceptId!: string | null;
  /** Estado de la vinculación (pendiente/activa/suspendida/rechazada/finalizada). */
  @ApiProperty({ format: 'uuid' }) status!: string;
  /** ¿Es la organización principal del profesional? */
  @ApiProperty() isPrimary!: boolean;
  /** Vigente desde. */
  @ApiPropertyOptional({ nullable: true }) validFrom!: Date | null;
  /** Vigente hasta (null = sigue vigente). */
  @ApiPropertyOptional({ nullable: true }) validTo!: Date | null;
  /** Fecha de creación de la vinculación (o de la solicitud). */
  @ApiProperty() createdAt!: Date;
  /**
   * Logo de la organización, tomado de su ficha pública
   * (`community.public_profiles`), o `null` si no tiene una.
   */
  @ApiPropertyOptional({ nullable: true }) avatarUrl!: string | null;
}
