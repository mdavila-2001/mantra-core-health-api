import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

/** Supuestos del «¿y si…?»: cada bandera reemplaza el atributo real SOLO en este cálculo. */
export class ExplainAssumeDto {
  @ApiPropertyOptional() @IsOptional() @IsBoolean() stepUpFresh?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() doctorOnline?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() reasonProvided?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() approvalGranted?: boolean;
  @ApiPropertyOptional({
    description:
      'Evalúa también los permisos aunque una denegación temprana ya decida.',
  })
  @IsOptional()
  @IsBoolean()
  forceFull?: boolean;
}

/** Pregunta de «explicar decisión» (CONTRATO-GOBIERNO §5.2). */
export class ExplainAccessDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Vínculo de la persona (o `userId`).',
  })
  @IsOptional()
  @IsUUID()
  engagementId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Persona (o `engagementId`).',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({
    example: 'agenda.appointment.cancel',
    description: 'Permiso o código antiguo.',
  })
  @IsString()
  @MaxLength(80)
  action!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  practitionerRoleAssignmentId?: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  healthcareServiceId?: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  careSpaceId?: string | null;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  patientProfileId?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  appointmentStartAt?: string;

  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Por defecto, ahora.',
  })
  @IsOptional()
  @IsDateString()
  at?: string;

  @ApiPropertyOptional({ type: ExplainAssumeDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ExplainAssumeDto)
  assume?: ExplainAssumeDto;
}

/** Autoservicio: la misma pregunta, de la propia persona, en una organización. */
export class ExplainMyAccessDto extends ExplainAccessDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Organización (se verifica contra sus vínculos).',
  })
  @IsUUID()
  tenantId!: string;
}

/** El doctor pregunta por alguien de su equipo, solo sobre su agenda. */
export class ExplainTeamAccessDto extends ExplainAccessDto {}

export class SimulationMoneyDto {
  @ApiProperty({ enum: ['BOB'] }) @IsIn(['BOB']) currency!: 'BOB';
  @ApiProperty() @IsInt() @Min(0) minorUnits!: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  discountPercent?: number;
}

export class SimulationScenarioDto {
  @ApiProperty() @IsString() @MaxLength(120) label!: string;
  @ApiProperty() @IsString() @MaxLength(80) action!: string;
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  practitionerRoleAssignmentId?: string | null;
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  healthcareServiceId?: string | null;
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  careSpaceId?: string | null;
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  patientProfileId?: string;
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  appointmentStartAt?: string;
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  at?: string;
  @ApiPropertyOptional({ type: SimulationMoneyDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SimulationMoneyDto)
  amount?: SimulationMoneyDto;
}

export class SimulationDraftGrantDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Con `id` reemplaza esa concesión; sin `id` es nueva.',
  })
  @IsOptional()
  @IsUUID()
  id?: string;
  @ApiProperty({ enum: ['ALLOW', 'DENY'] }) @IsIn(['ALLOW', 'DENY']) effect!:
    'ALLOW' | 'DENY';
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMaxSize(80)
  @IsString({ each: true })
  actions!: string[];
  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  condition?: Record<string, unknown>;
  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  actionConditions?: Record<string, Record<string, unknown>>;
  @ApiPropertyOptional() @IsOptional() @IsString() targetKind?: string;
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  practitionerRoleAssignmentId?: string;
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  healthcareServiceId?: string;
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  careSpaceId?: string;
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  practiceSiteId?: string;
  @ApiPropertyOptional({ enum: ['DYNAMIC', 'FIXED'] })
  @IsOptional()
  @IsIn(['DYNAMIC', 'FIXED'])
  expansionMode?: 'DYNAMIC' | 'FIXED';
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  validTo?: string;
}

export class SimulationDraftDto {
  @ApiProperty({ enum: ['PATCH', 'REPLACE'] })
  @IsIn(['PATCH', 'REPLACE'])
  mode!: 'PATCH' | 'REPLACE';
  @ApiPropertyOptional({
    nullable: true,
    description: 'Simula el cambio de plantilla (mover).',
  })
  @IsOptional()
  @Matches(/^[A-Z_]{3,40}$/)
  templateCode?: string | null;
  @ApiProperty({ type: [SimulationDraftGrantDto] })
  @IsArray()
  @ArrayMaxSize(60)
  @ValidateNested({ each: true })
  @Type(() => SimulationDraftGrantDto)
  grants!: SimulationDraftGrantDto[];
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  removeGrantIds?: string[];
}

/** Simular antes de guardar (CONTRATO-GOBIERNO §5.3). */
export class SimulateAccessDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() engagementId!: string;
  @ApiProperty({ type: SimulationDraftDto })
  @ValidateNested()
  @Type(() => SimulationDraftDto)
  draft!: SimulationDraftDto;
  @ApiPropertyOptional({ type: [SimulationScenarioDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => SimulationScenarioDto)
  scenarios?: SimulationScenarioDto[];
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  autoScenarios?: boolean;
}

/** Respuesta de explicar y simular: la forma exacta de `ExplainResponse`/`SimulateResponse` del dominio. */
export class ExplainAccessResponseDto {
  @ApiProperty({ type: 'object', additionalProperties: true })
  decision!: Record<string, unknown>;
  @ApiProperty() summary!: string;
  @ApiProperty({ type: 'object', additionalProperties: true })
  decidedBy!: Record<string, unknown>;
  @ApiProperty({ type: [Object] }) reasons!: Record<string, unknown>[];
  @ApiProperty({ type: [Object] }) missing!: Record<string, unknown>[];
  @ApiPropertyOptional({ type: [Object] }) adminFixes?: Record<
    string,
    unknown
  >[];
  @ApiPropertyOptional({
    description: 'Autoservicio: qué pedirle al administrador.',
  })
  askAdmin?: string;
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Autoservicio: organización consultada.',
  })
  tenantId?: string;
  @ApiProperty({ type: 'object', additionalProperties: true })
  obligations!: Record<string, unknown>;
  @ApiProperty({ type: 'object', additionalProperties: true })
  visibleFields!: Record<string, unknown>;
  @ApiProperty({ type: [Object] }) usage!: Record<string, unknown>[];
  @ApiProperty() evaluatedAt!: string;
  @ApiProperty() correlationId!: string;
}

export class SimulateAccessResponseDto {
  @ApiProperty() valid!: boolean;
  @ApiProperty({ type: 'object', additionalProperties: true })
  validation!: Record<string, unknown>;
  @ApiProperty({ type: 'object', additionalProperties: true })
  governance!: Record<string, unknown>;
  @ApiProperty({ type: 'object', additionalProperties: true }) summary!: Record<
    string,
    unknown
  >;
  @ApiProperty({ type: [Object] }) scenarios!: Record<string, unknown>[];
  @ApiProperty({ type: 'object', additionalProperties: true }) impact!: Record<
    string,
    unknown
  >;
  @ApiPropertyOptional() simulationToken?: string;
  @ApiProperty({ type: 'object', additionalProperties: true }) limits!: Record<
    string,
    unknown
  >;
  @ApiProperty() evaluatedAt!: string;
}
