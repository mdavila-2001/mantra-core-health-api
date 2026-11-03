import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

/** Un integrante del equipo en el panel del doctor. */
export class GovernancePanelTeamMemberDto {
  @ApiProperty({ format: 'uuid' }) userId!: string;
  @ApiProperty({ format: 'uuid', description: 'El vínculo con el doctor.' })
  engagementId!: string;
  @ApiProperty({ nullable: true, type: String }) templateCode!: string | null;
  @ApiProperty() liveGrants!: number;
}

/** Una alerta abierta sobre la actividad de la agenda del doctor. */
export class GovernancePanelAnomalyDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) userId!: string;
  @ApiProperty({
    description: 'Tipo de la alerta, p. ej. `ANOMALY_CANCEL_SPIKE`.',
  })
  kindConceptId!: string;
  @ApiProperty({ type: String, format: 'date-time' }) windowStart!: string;
  @ApiProperty() observed!: number;
  @ApiProperty() threshold!: number;
}

/** `GET /me/practitioner/governance-panel`. */
export class PractitionerGovernancePanelDto {
  @ApiProperty({ type: String, format: 'date-time' }) generatedAt!: string;
  @ApiProperty({
    type: [GovernancePanelTeamMemberDto],
    description:
      'Reservado: la lista del equipo la da `GET /me/practitioner/support-team`; acá va vacía.',
  })
  team!: GovernancePanelTeamMemberDto[];
  @ApiProperty({ description: 'Revisiones de acceso que esperan al doctor.' })
  pendingReviews!: number;
  @ApiProperty({ type: [GovernancePanelAnomalyDto] })
  openAnomalies!: GovernancePanelAnomalyDto[];
}

/** Query de `GET /approvals/pending`. */
export class PendingApprovalsQueryDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ description: '`nextCursor` de la página anterior.' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  cursor?: string;
}

/** Una aprobación que espera la decisión de quien consulta. */
export class PendingApprovalDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) tenantId!: string;
  @ApiProperty({ description: 'ACTION, GRANT_CHANGE, SOD_EXCEPTION…' })
  kind!: string;
  @ApiProperty({ example: 'PENDING' }) status!: string;
  @ApiProperty({ example: 'DOCTOR_OWNER' }) approverKind!: string;
  @ApiPropertyOptional({ type: String }) atom?: string;
  @ApiProperty({ format: 'uuid' }) requesterUserId!: string;
  @ApiPropertyOptional({ type: String, format: 'uuid' })
  subjectUserId?: string;
  @ApiPropertyOptional({ type: String }) reasonText?: string;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: string;
  @ApiProperty({ type: String, format: 'date-time' }) expiresAt!: string;
  @ApiProperty({ description: 'Qué se pide, en lenguaje simple.' })
  summary!: string;
}

/** `GET /approvals/pending`. */
export class PendingApprovalsPageDto {
  @ApiProperty({ type: [PendingApprovalDto] }) items!: PendingApprovalDto[];
  @ApiProperty() count!: number;
  @ApiProperty({ nullable: true, type: String }) nextCursor!: string | null;
}
