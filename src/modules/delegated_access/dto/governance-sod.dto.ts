import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export const SOD_SCOPES = ['PERSON', 'PERSON_OVERLAP', 'TRANSACTION'] as const;
export const SOD_ACTIONS = ['BLOCK', 'REQUIRE_APPROVAL', 'WARN'] as const;

const SOD_CODE_REGEX = /^[A-Z][A-Z0-9]*(-[A-Z0-9]+){1,3}$/;

/** Regla SoD propia de la organización (o que endurece una de plataforma). */
export class CreateSodRuleDto {
  @ApiProperty({ example: 'ORG-CAJA-01' })
  @IsString()
  @Matches(SOD_CODE_REGEX, {
    message: 'El código va en mayúsculas con guiones, por ejemplo ORG-CAJA-01',
  })
  @MaxLength(40)
  code!: string;

  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({
    description: 'Código de la regla de plataforma que esta endurece.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  baseRuleCode?: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(40)
  @IsString({ each: true })
  atomsA!: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(40)
  @IsString({ each: true })
  atomsB!: string[];

  @ApiProperty({ enum: SOD_SCOPES })
  @IsIn(SOD_SCOPES)
  scope!: (typeof SOD_SCOPES)[number];

  @ApiProperty({ enum: SOD_ACTIONS })
  @IsIn(SOD_ACTIONS)
  action!: (typeof SOD_ACTIONS)[number];

  @ApiPropertyOptional({ description: 'Sin excepción posible.' })
  @IsOptional()
  @IsBoolean()
  isHard?: boolean;

  @ApiPropertyOptional({ minimum: 1, maximum: 180 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(180)
  maxExceptionDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  rationale?: string;
}

export class UpdateSodRuleDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  expectedRowVersion!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  atomsA?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  atomsB?: string[];

  @ApiPropertyOptional({ enum: SOD_SCOPES })
  @IsOptional()
  @IsIn(SOD_SCOPES)
  scope?: (typeof SOD_SCOPES)[number];

  @ApiPropertyOptional({ enum: SOD_ACTIONS })
  @IsOptional()
  @IsIn(SOD_ACTIONS)
  action?: (typeof SOD_ACTIONS)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isHard?: boolean;

  @ApiPropertyOptional({ minimum: 1, maximum: 180 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(180)
  maxExceptionDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  rationale?: string;
}

export class RequestSodExceptionDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  engagementId!: string;

  @ApiProperty({ example: 'SOD-BILL-03' })
  @IsString()
  @MaxLength(40)
  ruleCode!: string;

  @ApiProperty({
    minLength: 30,
    description: 'Por qué se necesita (al menos 30 caracteres).',
  })
  @IsString()
  @MaxLength(1000)
  justification!: string;

  @ApiProperty({
    format: 'date-time',
    description: 'Fin de la excepción: obligatorio.',
  })
  @IsDateString()
  validTo!: string;
}

export class RevokeSodExceptionDto {
  @ApiProperty({ minLength: 5 })
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  reason!: string;
}

export class SodRuleViewDto {
  @ApiPropertyOptional({ format: 'uuid' }) id?: string;
  @ApiProperty() code!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ type: [String] }) atomsA!: string[];
  @ApiProperty({ type: [String] }) atomsB!: string[];
  @ApiProperty({ enum: SOD_SCOPES }) scope!: string;
  @ApiProperty({ enum: SOD_ACTIONS }) action!: string;
  @ApiProperty() isHard!: boolean;
  @ApiPropertyOptional({ nullable: true }) maxExceptionDays?: number | null;
  @ApiPropertyOptional() rationale?: string;
  @ApiPropertyOptional() baseRuleCode?: string;
  @ApiProperty({ description: 'Verdadero si es de plataforma (solo lectura).' })
  platform!: boolean;
  @ApiPropertyOptional() rowVersion?: number;
}

export class ListSodRulesResponseDto {
  @ApiProperty({ type: [SodRuleViewDto] }) items!: SodRuleViewDto[];
  @ApiProperty() count!: number;
}

export class SodFindingViewDto {
  @ApiProperty({ format: 'uuid' }) engagementId!: string;
  @ApiProperty({ format: 'uuid' }) userId!: string;
  @ApiProperty() ruleCode!: string;
  @ApiProperty() ruleName!: string;
  @ApiProperty({ enum: SOD_ACTIONS }) action!: string;
  @ApiProperty({
    enum: ['BLOCKED', 'EXCEPTION_REQUIRED', 'WARNING', 'EXCEPTED'],
  })
  outcome!: string;
  @ApiProperty({ type: [String] }) atomsA!: string[];
  @ApiProperty({ type: [String] }) atomsB!: string[];
  @ApiPropertyOptional({ format: 'uuid' }) exceptionId?: string;
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  exceptionValidTo?: Date;
  @ApiProperty() admitsException!: boolean;
  @ApiProperty() message!: string;
}

export class ListSodFindingsResponseDto {
  @ApiProperty({ type: [SodFindingViewDto] }) items!: SodFindingViewDto[];
  @ApiProperty() count!: number;
}

export class SodExceptionViewDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() ruleCode!: string;
  @ApiProperty({ format: 'uuid' }) engagementId!: string;
  @ApiProperty() justification!: string;
  @ApiProperty({ type: String, format: 'date-time' }) validFrom!: Date;
  @ApiProperty({ type: String, format: 'date-time' }) validTo!: Date;
  @ApiProperty({ enum: ['ACTIVE', 'EXPIRED', 'REVOKED'] }) status!: string;
  @ApiPropertyOptional({ type: String, format: 'date-time' }) revokedAt?: Date;
}

export class ListSodExceptionsResponseDto {
  @ApiProperty({ type: [SodExceptionViewDto] }) items!: SodExceptionViewDto[];
  @ApiProperty() count!: number;
}

/** Respuesta 202 de una petición que crea un cuatro ojos. */
export class FourEyesRequestedDto {
  @ApiProperty({ format: 'uuid' }) approvalId!: string;
  @ApiProperty() status!: string;
  @ApiProperty({ type: String, format: 'date-time' }) expiresAt!: Date;
  @ApiProperty({ enum: ['DOCTOR', 'SERVICE_HEAD', 'SECOND_APPROVER'] })
  approverKind!: string;
}
