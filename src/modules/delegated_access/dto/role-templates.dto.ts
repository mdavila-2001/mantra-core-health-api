import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { SUPPORT_ACTIONS, type SupportActionCode } from '../domain';

/** Cuerpo de `POST /org/role-templates`: plantilla propia de la organización. */
export class CreateRoleTemplateDto {
  /** Código único por organización. */
  @ApiProperty({ maxLength: 60 })
  @IsString()
  @Matches(/^[A-Z][A-Z0-9_]{1,59}$/)
  code!: string;

  /** Nombre visible. */
  @ApiProperty({ maxLength: 120 })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  /** Acciones por defecto. */
  @ApiProperty({ enum: SUPPORT_ACTIONS, isArray: true })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsIn(SUPPORT_ACTIONS, { each: true })
  defaultActions!: SupportActionCode[];
}

/** Cuerpo de `PATCH /org/role-templates/:id`: publica una versión nueva. */
export class UpdateRoleTemplateDto {
  /** Nuevo nombre. */
  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  /** Nuevas acciones por defecto (reemplazan a las anteriores). */
  @ApiPropertyOptional({ enum: SUPPORT_ACTIONS, isArray: true })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsIn(SUPPORT_ACTIONS, { each: true })
  defaultActions?: SupportActionCode[];
}

/** Una plantilla de rol. */
export class RoleTemplateViewDto {
  /** Id de la plantilla. */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /** Código. */
  @ApiProperty() code!: string;
  /** Nombre. */
  @ApiProperty() name!: string;
  /** Acciones por defecto. */
  @ApiProperty({ type: [String] }) defaultActions!: string[];
  /** ¿Es de plataforma (no editable por la organización)? */
  @ApiProperty() platform!: boolean;
  /** Versión. */
  @ApiProperty() versionNumber!: number;
}

/** Lista de plantillas visibles. */
export class ListRoleTemplatesResponseDto {
  /** Plantillas. */
  @ApiProperty({ type: [RoleTemplateViewDto] }) items!: RoleTemplateViewDto[];
  /** Cantidad. */
  @ApiProperty() count!: number;
}
